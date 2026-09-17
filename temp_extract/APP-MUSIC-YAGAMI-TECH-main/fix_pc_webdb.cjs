const fs = require('fs');
let code = fs.readFileSync('src/components/PlayerContext.tsx', 'utf8');

const injection = `
import { WebStorage } from '../lib/WebStorage';
`;

code = code.replace("import axios from \"axios\";", "import axios from \"axios\";\n" + injection);

const originalUrlCheck = `
      if (!streamUrl && lp && Capacitor.isNativePlatform()) {
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

      if (!streamUrl && track.local_path && Capacitor.isNativePlatform()) {
        streamUrl = track.local_path.startsWith('file://') ? track.local_path : \`file://\${track.local_path}\`;
      } else if (!streamUrl) {`;

const newUrlCheck = `
      if (!streamUrl && lp) {
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
      }

      if (!streamUrl && track.local_path && Capacitor.isNativePlatform()) {
        streamUrl = track.local_path.startsWith('file://') ? track.local_path : \`file://\${track.local_path}\`;
      } else if (!streamUrl) {`;

code = code.replace(originalUrlCheck, newUrlCheck);
fs.writeFileSync('src/components/PlayerContext.tsx', code);
console.log('done');
