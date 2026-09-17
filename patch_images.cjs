const fs = require('fs');

const fallbackSrc = "e.currentTarget.src = 'https://placehold.co/400x400/1C1C1E/FFFFFF/png?text=Audio'";

const patchFile = (path) => {
  if (!fs.existsSync(path)) return;
  let code = fs.readFileSync(path, 'utf8');
  // replace <img ... /> and add onError
  code = code.replace(/<img([^>]*)>/g, (match, p1) => {
    if (p1.includes('onError=')) return match;
    return `<img${p1} onError={(e) => { ${fallbackSrc} }}>`;
  });
  fs.writeFileSync(path, code);
};

patchFile('src/components/TrackItem.tsx');
patchFile('src/components/AlbumCard.tsx');
patchFile('src/components/MiniPlayer.tsx');
patchFile('src/components/PlayerContext.tsx');
patchFile('src/components/HomeTab.tsx');
patchFile('src/components/LibraryTab.tsx');

