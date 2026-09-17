const fs = require('fs');

const fixFile = (path) => {
  if (!fs.existsSync(path)) return;
  let code = fs.readFileSync(path, 'utf8');
  // Make sure all <img ... onError={...}> have the closing slash <img ... onError={...} />
  code = code.replace(/<img([^>]*)>/g, (match, p1) => {
    // If it doesn't end with /, add it
    if (!match.endsWith('/>')) {
       return `<img${p1}/>`;
    }
    return match;
  });
  fs.writeFileSync(path, code);
};

fixFile('src/components/TrackItem.tsx');
fixFile('src/components/AlbumCard.tsx');
fixFile('src/components/MiniPlayer.tsx');
fixFile('src/components/PlayerContext.tsx');
fixFile('src/components/HomeTab.tsx');
fixFile('src/components/LibraryTab.tsx');
fixFile('src/components/Player.tsx');

