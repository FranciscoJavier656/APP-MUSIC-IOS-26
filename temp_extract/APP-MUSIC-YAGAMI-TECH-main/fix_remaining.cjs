const fs = require('fs');

// ExpandedPlayer
let expCode = fs.readFileSync('src/components/ExpandedPlayer.tsx', 'utf8');
expCode = expCode.replace(
  /setContextMenuTrack\(currentTrack\)/g,
  "setContextMenuTrack({ item: currentTrack, type: 'track' })"
);
fs.writeFileSync('src/components/ExpandedPlayer.tsx', expCode);

// SearchTab
let searchCode = fs.readFileSync('src/components/SearchTab.tsx', 'utf8');
searchCode = searchCode.replace(
  /setContextMenuTrack\(track\)/g,
  "setContextMenuTrack({ item: track, type: 'track' })"
);
fs.writeFileSync('src/components/SearchTab.tsx', searchCode);

// AlbumView
let albumCode2 = fs.readFileSync('src/components/AlbumView.tsx', 'utf8');
albumCode2 = albumCode2.replace(
  /setContextMenuTrack\(\{\.\.\.track\, album\}\)/g,
  "setContextMenuTrack({ item: {...track, album}, type: 'track' })"
);
fs.writeFileSync('src/components/AlbumView.tsx', albumCode2);

