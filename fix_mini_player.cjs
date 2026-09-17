const fs = require('fs');
let code = fs.readFileSync('src/components/MiniPlayer.tsx', 'utf8');

if (!code.includes("import { OfflineImage }")) {
   code = code.replace("import { getImageSrc } from '../lib/image';", "import { getImageSrc } from '../lib/image';\nimport { OfflineImage } from './OfflineImage';");
}

code = code.replace(/<img src=\{getImageSrc\(currentTrack\.image\)\}/g, "<OfflineImage localPath={currentTrack.localCoverPath || currentTrack.original?.localCoverPath} remoteUrl={getImageSrc(currentTrack.album?.image || currentTrack.image)}");

fs.writeFileSync('src/components/MiniPlayer.tsx', code);
console.log('done');
