import { Capacitor } from '@capacitor/core';
import axios from 'axios';
import { QobuzAudio } from './QobuzAudioPlugin';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { getQobuzTrackUrl } from './qobuz';

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
    
    // Disparar estado de que empezó a descargar (si estaba en cola)
    window.dispatchEvent(new CustomEvent('download_state', {
      detail: { trackId: item.track.id.toString(), status: 'downloading' }
    }));

    try {
      await processSingleDownload(item.track, item.formatId, item.ext);
      item.resolve(true);
    } catch (e) {
      console.error("Queue process error for track:", item.track.id, e);
      // Faltaba disparar el error para que la UI se entere si falla antes de descargar
      window.dispatchEvent(new CustomEvent('download_error', { 
        detail: { trackId: item.track.id.toString(), error: (e as any).message || "Error al procesar" } 
      }));
      item.resolve(false);
    } finally {
      this.activeDownloads--;
      this.processQueue();
    }
  }
}

const queueManager = new DownloadQueueManager();
const downloadMap: Record<string, string> = {};

if (Capacitor.isNativePlatform()) {
  Filesystem.addListener('progress', (progress) => {
    const trackId = downloadMap[progress.url];
    if (trackId) {
      let percent = 0;
      if (progress.contentLength === 0) {
        percent = progress.bytes / 10_000_000; // Fake estimate if unknown
      } else {
        percent = Math.min(progress.bytes / progress.contentLength, 0.95);
      }
      window.dispatchEvent(new CustomEvent('download_progress', {
        detail: { trackId, progress: percent, bytes: progress.bytes, total: progress.contentLength }
      }));
    }
  });
}

// --- LOGICA DE METADATOS (IDÉNTICA A REDUX ORIGINAL) ---
const addMetadataToLibrary = (trackWithLocalPath: any) => {
  try {
    const trackId = trackWithLocalPath.id.toString();
    const trackTitle = trackWithLocalPath.title || 'Unknown';
    const artistName = trackWithLocalPath.artist?.name || trackWithLocalPath.performer?.name || 'Unknown Artist';
    const albumTitle = trackWithLocalPath.album?.title || 'Unknown Album';
    const artistId = trackWithLocalPath.artist?.id?.toString() || artistName;
    const albumId = trackWithLocalPath.album?.id?.toString() || albumTitle;

    // 1. Guardar el Track
    const offlineTracks = JSON.parse(localStorage.getItem('offline_library_tracks') || '{}');
    offlineTracks[trackId] = {
      id: trackId,
      title: trackTitle,
      subtitle: artistName,
      image: trackWithLocalPath.album?.image?.small || trackWithLocalPath.image?.small || trackWithLocalPath.image,
      type: 'track',
      original: trackWithLocalPath,
      downloadedAt: Date.now()
    };
    localStorage.setItem('offline_library_tracks', JSON.stringify(offlineTracks));
    
    // Por retrocompatibilidad (para la pestaña Downloads)
    const oldTracks = JSON.parse(localStorage.getItem('offline_tracks') || '{}');
    oldTracks[trackId] = trackWithLocalPath;
    localStorage.setItem('offline_tracks', JSON.stringify(oldTracks));

    // 2. Guardar el Album
    const offlineAlbums = JSON.parse(localStorage.getItem('offline_library_albums') || '{}');
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
    localStorage.setItem('offline_library_albums', JSON.stringify(offlineAlbums));

    // 3. Guardar el Artista
    const offlineArtists = JSON.parse(localStorage.getItem('offline_library_artists') || '{}');
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
    localStorage.setItem('offline_library_artists', JSON.stringify(offlineArtists));

    // Notificar UI
    window.dispatchEvent(new CustomEvent('offline-library-updated'));
  } catch (e) {
    console.error('Error saving metadata to library components', e);
  }
};

export const downloadFileWeb = async (url: string, filename: string) => {
  // Override global timeout to 0 (no timeout) for large file downloads
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

// Logica interna del proceso de descarga
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
  
  if (Capacitor.isNativePlatform()) {
    downloadMap[url] = trackId;
    const filename = `${trackId}.${ext}`;
    
    try {
      await withRetry(async () => {
         await Filesystem.downloadFile({
           url: url,
           path: `Downloads/${filename}`,
           directory: Directory.Data,
           progress: true
         });
      }, 3, 3000);
      
      window.dispatchEvent(new CustomEvent('download_state', { detail: { trackId, status: 'processing_metadata' } }));
      
      window.dispatchEvent(new CustomEvent('download_state', { detail: { trackId, status: 'importing_library' } }));
      
      // Organizar metadatos en las 3 secciones (Albums, Artistas, Tracks)
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

      let sizeBytes = 0;
      try {
         const stat = await Filesystem.stat({ directory: Directory.Data, path: `Downloads/${filename}` });
         sizeBytes = stat.size;
      } catch(e) {}

      const trackWithLocalPath = {
        ...track,
        localPath: `Downloads/${filename}`,
        localCoverPath: localCoverPath,
        sizeBytes: sizeBytes,
        downloadedAt: Date.now()
      };
      
      addMetadataToLibrary(trackWithLocalPath);
      
      window.dispatchEvent(new CustomEvent('download_state', { detail: { trackId, status: 'organizing' } }));
      
      window.dispatchEvent(new CustomEvent('download_state', { detail: { trackId, status: 'completed' } }));
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
      
      delete downloadMap[url];
    } catch (e: any) {
      let errorMsg = e.message || 'Error nativo';
      const msgLower = errorMsg.toLowerCase();
      if (msgLower.includes('space') || msgLower.includes('quota') || msgLower.includes('full')) {
        errorMsg = "Almacenamiento lleno. Por favor, libera espacio.";
      }
      window.dispatchEvent(new CustomEvent('download_error', { detail: { trackId, error: errorMsg } }));
      delete downloadMap[url];
      throw e;
    }
  } else {
    // Web mock
    const filename = `${track.track_number?.toString().padStart(2, '0') || '01'} - ${(track.title || 'Track').replace(/[/\\?+%*:_|"<>]/g, '-')}.${ext}`;
    await downloadFileWeb(url, filename);
    
    // Añadimos metadatos también en Web para que aparezca en la pestaña de descargas
    const trackWithLocalPath = {
      ...track,
      localPath: '',
      downloadedAt: Date.now()
    };
    addMetadataToLibrary(trackWithLocalPath);
    window.dispatchEvent(new CustomEvent('download_state', { detail: { trackId: track.id.toString(), status: 'completed' } }));
  }
};

// ENTRADA PRINCIPAL ENRUTADA (LA QUE LLAMA LA UI)
export const downloadTrackRouted = async (
  track: any, 
  formatId: string, 
  ext: string
): Promise<boolean> => {
  try {
    if (Capacitor.isNativePlatform()) {
      // Si es nativo, encolamos y devolvemos true INMEDIATAMENTE para liberar la UI, 
      // la UI ya puso el track en 'queued' vía DownloadContext.
      queueManager.enqueue(track, formatId, ext);
      return true;
    } else {
      console.log(`[Web] Procesando descarga web: ${track.title}`);
      await processSingleDownload(track, formatId, ext);
      return true;
    }
  } catch (e: any) {
    console.error("Fallo al descargar track", track.id, e);
    window.dispatchEvent(new CustomEvent('download_error', { detail: { trackId: track.id.toString(), error: e.message || "Error" } }));
    return false;
  }
};
