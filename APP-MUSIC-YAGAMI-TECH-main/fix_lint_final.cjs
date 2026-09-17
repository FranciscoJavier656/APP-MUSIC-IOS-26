const fs = require('fs');
let dl = fs.readFileSync('src/components/DownloadsTab.tsx', 'utf8');
dl = dl.replace(/error: \(item as any\)\.error/g, '(item as any).error');
dl = dl.replace(/item\.error/g, '(item as any).error');
fs.writeFileSync('src/components/DownloadsTab.tsx', dl);

let pl = fs.readFileSync('src/components/PlayerContext.tsx', 'utf8');
pl = pl.replace(/type: 'album'\|'track'/g, "type: 'album'|'track'|'playlist'");
fs.writeFileSync('src/components/PlayerContext.tsx', pl);
