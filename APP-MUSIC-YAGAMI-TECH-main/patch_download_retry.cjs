const fs = require('fs');
let code = fs.readFileSync('src/lib/DownloadManager.ts', 'utf8');

const target = `const processSingleDownload = async (track: any, formatId: string, ext: string): Promise<void> => {
  const url = await getQobuzTrackUrl(track.id.toString(), formatId);
  if (!url) throw new Error("No URL");
  
  if (Capacitor.isNativePlatform()) {
    const trackId = track.id.toString();
    downloadMap[url] = trackId;
    const filename = \`\${trackId}.\${ext}\`;
    
    try {
      await Filesystem.downloadFile({
        url: url,
        path: \`Downloads/\${filename}\`,
        directory: Directory.Data,
        progress: true
      });`;

const replacement = `const withRetry = async <T>(fn: () => Promise<T>, retries = 3, delay = 2000): Promise<T> => {
  try {
    return await fn();
  } catch (error) {
    if (retries <= 0) throw error;
    console.warn(\`Retrying... (\${retries} left) due to:\`, error);
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
    const filename = \`\${trackId}.\${ext}\`;
    
    try {
      await withRetry(async () => {
         await Filesystem.downloadFile({
           url: url,
           path: \`Downloads/\${filename}\`,
           directory: Directory.Data,
           progress: true
         });
      }, 3, 3000);`;

code = code.replace(target, replacement);

fs.writeFileSync('src/lib/DownloadManager.ts', code);
