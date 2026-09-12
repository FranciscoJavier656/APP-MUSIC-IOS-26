const fs = require('fs');
let code = fs.readFileSync('src/components/TrackContextMenu.tsx', 'utf8');

code = code.replace(
  "itemType?: 'album' | 'track' | 'playlist';",
  "itemType?: 'album' | 'track' | 'playlist' | 'artist';"
);

fs.writeFileSync('src/components/TrackContextMenu.tsx', code);

let dlCode = fs.readFileSync('src/components/DownloadModal.tsx', 'utf8');
dlCode = dlCode.replace(
  "type: 'album' | 'track' | 'playlist';",
  "type: 'album' | 'track' | 'playlist' | 'artist';"
);
dlCode = dlCode.replace(
  "if ((type === 'album' || type === 'playlist') && !item.tracks?.items) {",
  "if ((type === 'album' || type === 'playlist' || type === 'artist') && !item.tracks?.items) {"
);
fs.writeFileSync('src/components/DownloadModal.tsx', dlCode);
