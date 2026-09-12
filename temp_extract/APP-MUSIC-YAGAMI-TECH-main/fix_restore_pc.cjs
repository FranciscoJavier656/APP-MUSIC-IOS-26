const fs = require('fs');
let code = fs.readFileSync('src/components/PlayerContext.tsx', 'utf8');

code = code.replace("import { WebStorage } from '../lib/WebStorage';\n", "");

const newUrlCheck = `      if (!streamUrl && lp) {
         if (lp.startsWith('webdb://')) {
             try {
                 const blobId = lp.replace('webdb://', '');
                 const blobUrl = await WebStorage.getBlobUrl(blobId);
                 if (blobUrl) streamUrl = blobUrl;
             } catch (e) {
                 console.error("Failed to get local WebStorage uri", e);
             }
         } else if (Capacitor.isNativePlatform()) {
             try {
                 const stat = await Filesystem.getUri({
                     directory: Directory.Data,
                     path: lp.replace('file://', '')
                 });
                 streamUrl = stat.uri;
             } catch(e) {
                 console.error("Failed to get local uri", e);
             }
         }
      }`;

const originalUrlCheck = `      if (!streamUrl && lp && Capacitor.isNativePlatform()) {
         try {
             const stat = await Filesystem.getUri({
                 directory: Directory.Data,
                 path: lp.replace('file://', '')
             });
             streamUrl = stat.uri;
         } catch(e) {
             console.error("Failed to get local uri", e);
         }
      }`;

code = code.replace(newUrlCheck, originalUrlCheck);
fs.writeFileSync('src/components/PlayerContext.tsx', code);
console.log('done');
