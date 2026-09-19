import { Capacitor, registerPlugin } from '@capacitor/core';
import axios from 'axios';
import { QobuzAudio } from './QobuzAudioPlugin';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { getQobuzTrackUrl } from './qobuz';
import bus from './eventBus';
import * as storage from './storage';

const YagamiNative = Capacitor.isNativePlatform() ? registerPlugin('YagamiDownloadManager') : null;

// --- TIPO DE DATOS ---
interface QueueItem {
  track: any;
  formatId: string;
  ext: string;
  resolve: (value: boolean) => void;
}

// --- QUEUE MANAGER ---
class DownloadQueueManager {
  private queue: QueueItem[] = [];
  private activeDownloads: number = 0;
  private MAX_CONCURRENT = 3;

  public async enqueue(track: any, formatId: string, ext: string): Promise<boolean> {
    return new Promise((resolve) => {
      this.queue.push({ track, formatId, ext, resolve });
      this.processQueue();
    });
  }

  private async processQueue() {
    if (this.activeDownloads >= this.MAX_CONCURRENT || this.queue.length === 0) {
      return;
    }
    this.activeDownloads++;
    const item = this.queue.shift()!;
    
    bus.emit('download_state', { trackId: item.track.id.toString(), status: 'downloading' });

    try {
      await processSingleDownload(item.track, item.formatId, item.ext);
      item.resolve(true);
    } catch (e) {
      console.error("Queue process error for track:", item.track.id, e);
      bus.emit('download_error', { trackId: item.track.id.toString(), error: (e as any).message || "Error al procesar" });
      item.resolve(false);
    } finally {
      this.activeDownloads--;
      this.processQueue();
    }
  }
}

const queueManager = new DownloadQueueManager();

// Native Progress Listener is now handled inside DownloadContext via native plugin events
// BUT the plugin already fires events named onDownloadProgress, onDownloadStateChange, etc.
// We need to bridge them to our eventBus.
if (Capacitor.isNativePlatform() && YagamiNative) {
  YagamiNative.addListener('onDownloadProgress', (info: any) => {
    bus.emit('download_progress', { 
      trackId: info.trackId, 
      progress: info.progress, 
      bytes: info.bytes || 0, 
      total: info.total || 0 
    });
  });

  YagamiNative.addListener('onDownloadStateChange', (info: any) => {
    bus.emit('download_state', { trackId: info.trackId, status: info.status });
  });

  YagamiNative.addListener('onDownloadCompleted', async (info: any) => {
    // The native plugin downloaded the file and sent the local path
    const trackId = info.trackId;
    
    // We should ideally pass track metadata to native plugin, and let it add to library,
    // or fetch from memory if we kept it. For now, we will handle metadata addition 
    // inside processSingleDownload which awaits the YagamiNative.downloadTrack promise
    // if we choose to make downloadTrack awaitable. But background downloads run asynchronously.
    // If we use background sessions, YagamiNative.downloadTrack returns {status: 'queued'}
    // We will just let the plugin download the audio.
  });

  YagamiNative.addListener('onDownloadError', (info: any) => {
    bus.emit('download_error', { trackId: info.trackId, error: info.error });
  });
}

// --- LOGICA DE METADATOS ---
export const addMetadataToLibrary = async (trackWithLocalPath: any) => {
  try {
    const trackId = trackWithLocalPath.id.toString();
    const trackTitle = trackWithLocalPath.title || 'Unknown';
    const artistName = trackWithLocalPath.artist?.name || trackWithLocalPath.performer?.name || 'Unknown Artist';
    const albumTitle = trackWithLocalPath.album?.title || 'Unknown Album';
    const artistId = trackWithLocalPath.artist?.id?.toString() || artistName;
    const albumId = trackWithLocalPath.album?.id?.toString() || albumTitle;

    // 1. Guardar el Track
    const offlineTracks = await storage.getOfflineLibraryTracks();
    offlineTracks[trackId] = {
      id: trackId,
      title: trackTitle,
      subtitle: artistName,
      image: trackWithLocalPath.album?.image?.small || trackWithLocalPath.image?.small || trackWithLocalPath.image,
      type: 'track',
      original: trackWithLocalPath,
      downloadedAt: Date.now()
    };
    await storage.setOfflineLibraryTracks(offlineTracks);
    
    // Por retrocompatibilidad (para la pestaña Downloads)
    const oldTracks = await storage.getOfflineTracks();
    oldTracks[trackId] = trackWithLocalPath;
    await storage.setOfflineTracks(oldTracks);

    // 2. Guardar el Album
    const offlineAlbums = await storage.getOfflineLibraryAlbums();
    if (!offlineAlbums[albumId]) {
      offlineAlbums[albumId] = {
        id: albumId,
        title: albumTitle,
        subtitle: artistName,
        image: trackWithLocalPath.album?.image?.large || trackWithLocalPath.album?.image?.small,
        type: 'album',
        trackCount: 1,
        genres: trackWithLocalPath.album?.genre?.name || trackWithLocalPath.genre?.name,
        releaseDate: trackWithLocalPath.album?.released_at || trackWithLocalPath.released_at,
        original: trackWithLocalPath
      };
    } else {
      offlineAlbums[albumId].trackCount += 1;
    }
    await storage.setOfflineLibraryAlbums(offlineAlbums);

    // 3. Guardar el Artista
    const offlineArtists = await storage.getOfflineLibraryArtists();
    if (!offlineArtists[artistId]) {
      offlineArtists[artistId] = {
        id: artistId,
        title: artistName,
        subtitle: 'Artista',
        image: trackWithLocalPath.artist?.image?.large || trackWithLocalPath.artist?.image?.small || trackWithLocalPath.album?.image?.small,
        type: 'artist',
        trackCount: 1,
        original: trackWithLocalPath
      };
    } else {
      offlineArtists[artistId].trackCount += 1;
    }
    await storage.setOfflineLibraryArtists(offlineArtists);

    // Notificar UI
    bus.emit('offline-library-updated');
  } catch (e) {
    console.error('Error saving metadata to library components', e);
  }
};

export const downloadFileWeb = async (url: string, filename: string) => {
  const res = await axios.get(url, { responseType: 'blob', timeout: 0 });
  const blobUrl = URL.createObjectURL(res.data);
  const a = document.createElement('a');
  a.href = blobUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(blobUrl);
};

const withRetry = async <T>(fn: () => Promise<T>, retries = 3, delay = 2000): Promise<T> => {
  try {
    return await fn();
  } catch (error) {
    if (retries <= 0) throw error;
    console.warn(`Retrying... (${retries} left) due to:`, error);
    await new Promise(res => setTimeout(res, delay));
    return withRetry(fn, retries - 1, delay * 1.5);
  }
};

const processSingleDownload = async (track: any, formatId: string, ext: string): Promise<void> => {
  const trackId = track.id.toString();
  
  const url = await withRetry(async () => {
    const res = await getQobuzTrackUrl(trackId, formatId);
    if (!res) throw new Error("No URL");
    return res;
  });
  
  if (Capacitor.isNativePlatform() && YagamiNative) {
    try {
      const filename = `${trackId}.${ext}`;
      
      let localCoverPath = null;
      try {
        const coverUrlObj = track.album?.image || track.image;
        let coverUrl = coverUrlObj?.large || coverUrlObj?.medium || coverUrlObj?.small || (typeof coverUrlObj === 'string' ? coverUrlObj : null);
        if (coverUrl) {
           if (coverUrl.startsWith('//')) coverUrl = 'https:' + coverUrl;
           const coverFilename = `${trackId}_cover.jpg`;
           await withRetry(async () => {
             await Filesystem.downloadFile({
               url: coverUrl,
               path: `Downloads/${coverFilename}`,
               directory: Directory.Data
             });
           }, 3, 2000);
           localCoverPath = `Downloads/${coverFilename}`;
        }
      } catch (ce) {
         console.warn("Could not download cover", ce);
      }

      // We call the native plugin to handle the background download.
      // It returns immediately with { status: "queued", trackId }
      await YagamiNative.downloadTrack({
        url: url,
        trackId: trackId,
        format: ext,
        title: track.title,
        artist: track.artist?.name || track.performer?.name,
        album: track.album?.title,
        artworkUrl: track.album?.image?.large || track.image?.large
      });

      // We don't await the end here anymore because the native side is handling it asynchronously
      // and will fire events. But we still add metadata right now so the app knows it exists.
      const trackWithLocalPath = {
        ...track,
        localPath: `Downloads/${filename}`,
        localCoverPath: localCoverPath,
        sizeBytes: 0, // Not immediately known
        downloadedAt: Date.now()
      };
      
      await addMetadataToLibrary(trackWithLocalPath);

      // Optionally fetch lyrics while it downloads
      try {
        const trackTitle = track.title || '';
        const trackArtist = track.artist?.name || track.performer?.name || '';
        const lrclibUrl = `https://lrclib.net/api/search?track_name=${encodeURIComponent(trackTitle)}&artist_name=${encodeURIComponent(trackArtist)}`;
        const lrclibRes = await axios.get(lrclibUrl, { timeout: 5000 });
        if (lrclibRes.data && lrclibRes.data.length > 0) {
          const bestMatch = lrclibRes.data[0];
          const lyricsText = bestMatch.syncedLyrics || bestMatch.plainLyrics;
          if (lyricsText) {
            const fileUri = await Filesystem.getUri({ directory: Directory.Data, path: `Downloads/${filename}` });
            await QobuzAudio.embedLyrics({ path: fileUri.uri, lyrics: lyricsText });
          }
        }
      } catch (e) {
        console.log("Lyrics embedding failed or skipped", e);
      }
      
    } catch (e: any) {
      let errorMsg = e.message || 'Error nativo';
      const msgLower = errorMsg.toLowerCase();
      if (msgLower.includes('space') || msgLower.includes('quota') || msgLower.includes('full')) {
        errorMsg = "Almacenamiento lleno. Por favor, libera espacio.";
      }
      bus.emit('download_error', { trackId, error: errorMsg });
      throw e;
    }
  } else {
    // Web mock
    const filename = `${track.track_number?.toString().padStart(2, '0') || '01'} - ${(track.title || 'Track').replace(/[/\\?+%*:_|"<>]/g, '-')}.${ext}`;
    await downloadFileWeb(url, filename);
    
    // Añadimos metadatos también en Web
    const trackWithLocalPath = {
      ...track,
      localPath: '',
      downloadedAt: Date.now()
    };
    await addMetadataToLibrary(trackWithLocalPath);
    bus.emit('download_state', { trackId: track.id.toString(), status: 'completed' });
  }
};

export const downloadTrackRouted = async (
  track: any, 
  formatId: string, 
  ext: string
): Promise<boolean> => {
  try {
    if (Capacitor.isNativePlatform()) {
      queueManager.enqueue(track, formatId, ext);
      return true;
    } else {
      await processSingleDownload(track, formatId, ext);
      return true;
    }
  } catch (e: any) {
    bus.emit('download_error', { trackId: track.id.toString(), error: e.message || "Error" });
    return false;
  }
};
