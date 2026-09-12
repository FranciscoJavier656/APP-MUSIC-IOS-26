const fs = require('fs');
let code = fs.readFileSync('src/lib/DownloadManager.ts', 'utf8');

const processSingleDownloadRegex = /const processSingleDownload = async \(track: any, formatId: string, ext: string\): Promise<void> => \{([\s\S]+?)\};\n\n\/\/ ENTRADA PRINCIPAL ENRUTADA/g;

const newBody = `const processSingleDownload = async (track: any, formatId: string, ext: string): Promise<void> => {
  const trackId = track.id.toString();
  
  const url = await withRetry(async () => {
    const res = await getQobuzTrackUrl(trackId, formatId);
    if (!res) throw new Error("No URL");
    return res;
  });

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
           localCoverPath = coverUrl;
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
  }
};

// ENTRADA PRINCIPAL ENRUTADA`;

code = code.replace(processSingleDownloadRegex, newBody);

const routedRegex = /export const downloadTrackRouted = async \([\s\S]+?\}\s*\};\n/g;
const newRouted = `export const downloadTrackRouted = async (
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
};
`;

code = code.replace(routedRegex, newRouted);

fs.writeFileSync('src/lib/DownloadManager.ts', code);
console.log('done');
