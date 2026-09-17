const fs = require('fs');

const fixFile = (path) => {
  if (!fs.existsSync(path)) return;
  let code = fs.readFileSync(path, 'utf8');
  code = code.replace(/\/ onError/g, 'onError');
  fs.writeFileSync(path, code);
};

fixFile('src/components/TrackItem.tsx');
fixFile('src/components/AlbumCard.tsx');
fixFile('src/components/MiniPlayer.tsx');
fixFile('src/components/PlayerContext.tsx');
fixFile('src/components/HomeTab.tsx');
fixFile('src/components/LibraryTab.tsx');
fixFile('src/components/Player.tsx');

