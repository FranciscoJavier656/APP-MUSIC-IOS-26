const fs = require('fs');
let code = fs.readFileSync('src/components/ExpandedPlayer.tsx', 'utf8');

if (!code.includes("import { OfflineImage }")) {
   code = code.replace("import { getImageSrc } from '../lib/image';", "import { getImageSrc } from '../lib/image';\nimport { OfflineImage } from './OfflineImage';");
}

const oldImg = `<img src={getImageSrc(track?.album?.image || track?.image)} alt={track.title} className="w-14 h-14 rounded-xl object-cover shadow-sm" />`;
const newImg = `<OfflineImage localPath={track.localCoverPath || track.original?.localCoverPath} remoteUrl={getImageSrc(track?.album?.image || track?.image)} alt={track.title} className="w-14 h-14 rounded-xl object-cover shadow-sm" />`;

if (code.includes(oldImg)) {
    code = code.replace(oldImg, newImg);
}

fs.writeFileSync('src/components/ExpandedPlayer.tsx', code);
