const fs = require('fs');

let code = fs.readFileSync('src/lib/DownloadManager.ts', 'utf8');

const webStorageStr = `
export const WebStorage = {
  dbPromise: null as Promise<IDBDatabase> | null,
  init() {
    if (!this.dbPromise) {
      this.dbPromise = new Promise((resolve, reject) => {
        const req = indexedDB.open('OfflineAudioDB', 1);
        req.onupgradeneeded = () => {
          req.result.createObjectStore('tracks');
        };
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      });
    }
    return this.dbPromise;
  },
  async saveBlob(id: string, blob: Blob) {
    const db = await this.init();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('tracks', 'readwrite');
      const store = tx.objectStore('tracks');
      store.put(blob, id);
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => reject(tx.error);
    });
  },
  async getBlobUrl(id: string): Promise<string | null> {
    const db = await this.init();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('tracks', 'readonly');
      const store = tx.objectStore('tracks');
      const req = store.get(id);
      req.onsuccess = () => {
        if (req.result) {
          resolve(URL.createObjectURL(req.result));
        } else {
          resolve(null);
        }
      };
      req.onerror = () => reject(req.error);
    });
  },
  async removeBlob(id: string) {
    const db = await this.init();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('tracks', 'readwrite');
      const store = tx.objectStore('tracks');
      store.delete(id);
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => reject(tx.error);
    });
  }
};
`;

code = code.replace("import { getQobuzTrackUrl } from './qobuz';", "import { getQobuzTrackUrl } from './qobuz';\n" + webStorageStr);

const processBlock = `  if (Capacitor.isNativePlatform()) {
    downloadMap[url] = trackId;
    const filename = \`\${trackId}.\${ext}\`;
    
    try {
      await withRetry(async () => {
         await Filesystem.downloadFile({
           url: url,
           path: \`Downloads/\${filename}\`,
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
           const coverFilename = \`\${trackId}_cover.jpg\`;
           await withRetry(async () => {
             await Filesystem.downloadFile({
               url: coverUrl,
               path: \`Downloads/\${coverFilename}\`,
               directory: Directory.Data
             });
           }, 3, 2000);
           localCoverPath = \`Downloads/\${coverFilename}\`;
        }
      } catch (ce) {
         console.warn("Could not download cover", ce);
      }

      const trackWithLocalPath = {
        ...track,
        localPath: \`Downloads/\${filename}\`,
        localCoverPath: localCoverPath,
        downloadedAt: Date.now()
      };
      
      addMetadataToLibrary(trackWithLocalPath);
      
      window.dispatchEvent(new CustomEvent('download_state', { detail: { trackId, status: 'organizing' } }));
      
      
      window.dispatchEvent(new CustomEvent('download_state', { detail: { trackId, status: 'completed' } }));
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
    const filename = \`\${track.track_number?.toString().padStart(2, '0') || '01'} - \${(track.title || 'Track').replace(/[/\\\\?+%*:_|"<>]/g, '-')}.\${ext}\`;
    await downloadFileWeb(url, filename);
  }`;

const newProcessBlock = `
    try {
      if (Capacitor.isNativePlatform()) {
        downloadMap[url] = trackId;
        const filename = \`\${trackId}.\${ext}\`;
        await withRetry(async () => {
           await Filesystem.downloadFile({
             url: url,
             path: \`Downloads/\${filename}\`,
             directory: Directory.Data,
             progress: true
           });
        }, 3, 3000);
      } else {
        window.dispatchEvent(new CustomEvent('download_state', { detail: { trackId, status: 'downloading' } }));
        const res = await axios.get(url, { 
           responseType: 'blob',
           onDownloadProgress: (progressEvent) => {
              if (progressEvent.total) {
                const percent = progressEvent.loaded / progressEvent.total;
                window.dispatchEvent(new CustomEvent('download_progress', {
                  detail: { trackId, progress: percent, bytes: progressEvent.loaded, total: progressEvent.total }
                }));
              }
           }
        });
        await WebStorage.saveBlob(trackId, res.data);
      }

      window.dispatchEvent(new CustomEvent('download_state', { detail: { trackId, status: 'processing_metadata' } }));
      window.dispatchEvent(new CustomEvent('download_state', { detail: { trackId, status: 'importing_library' } }));

      let localCoverPath = null;
      try {
        const coverUrlObj = track.album?.image || track.image;
        let coverUrl = coverUrlObj?.large || coverUrlObj?.medium || coverUrlObj?.small || (typeof coverUrlObj === 'string' ? coverUrlObj : null);
        if (coverUrl) {
           if (coverUrl.startsWith('//')) coverUrl = 'https:' + coverUrl;
           if (Capacitor.isNativePlatform()) {
             const coverFilename = \`\${trackId}_cover.jpg\`;
             await withRetry(async () => {
               await Filesystem.downloadFile({
                 url: coverUrl,
                 path: \`Downloads/\${coverFilename}\`,
                 directory: Directory.Data
               });
             }, 3, 2000);
             localCoverPath = \`Downloads/\${coverFilename}\`;
           } else {
             const coverRes = await axios.get(coverUrl, { responseType: 'blob' });
             const coverId = \`cover_\${trackId}\`;
             await WebStorage.saveBlob(coverId, coverRes.data);
             localCoverPath = \`webdb://\${coverId}\`;
           }
        }
      } catch (ce) {
         console.warn("Could not download cover", ce);
      }

      const trackWithLocalPath = {
        ...track,
        localPath: Capacitor.isNativePlatform() ? \`Downloads/\${trackId}.\${ext}\` : \`webdb://\${trackId}\`,
        localCoverPath: localCoverPath,
        downloadedAt: Date.now()
      };
      
      addMetadataToLibrary(trackWithLocalPath);
      
      window.dispatchEvent(new CustomEvent('download_state', { detail: { trackId, status: 'organizing' } }));
      window.dispatchEvent(new CustomEvent('download_state', { detail: { trackId, status: 'completed' } }));
      if (Capacitor.isNativePlatform()) delete downloadMap[url];
    } catch (e: any) {
      let errorMsg = e.message || 'Error en descarga';
      const msgLower = errorMsg.toLowerCase();
      if (msgLower.includes('space') || msgLower.includes('quota') || msgLower.includes('full')) {
        errorMsg = "Almacenamiento lleno. Por favor, libera espacio.";
      }
      window.dispatchEvent(new CustomEvent('download_error', { detail: { trackId, error: errorMsg } }));
      if (Capacitor.isNativePlatform()) delete downloadMap[url];
      throw e;
    }`;

code = code.replace(processBlock, newProcessBlock);


const routedBlock = `
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
      console.log(\`[Web] Procesando descarga web: \${track.title}\`);
      await processSingleDownload(track, formatId, ext);
      return true;
    }
  } catch (e: any) {
    console.error("Fallo al descargar track", track.id, e);
    window.dispatchEvent(new CustomEvent('download_error', { detail: { trackId: track.id.toString(), error: e.message || "Error" } }));
    return false;
  }
};`;

const newRoutedBlock = `
export const downloadTrackRouted = async (
  track: any, 
  formatId: string, 
  ext: string
): Promise<boolean> => {
  try {
    queueManager.enqueue(track, formatId, ext);
    return true;
  } catch (e: any) {
    console.error("Fallo al descargar track", track.id, e);
    window.dispatchEvent(new CustomEvent('download_error', { detail: { trackId: track.id.toString(), error: e.message || "Error" } }));
    return false;
  }
};`;

code = code.replace(routedBlock, newRoutedBlock);

fs.writeFileSync('src/lib/DownloadManager.ts', code);
console.log('done');
