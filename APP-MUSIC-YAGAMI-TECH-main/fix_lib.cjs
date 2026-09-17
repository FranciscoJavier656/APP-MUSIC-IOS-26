const fs = require('fs');
let code = fs.readFileSync('src/components/LibraryTab.tsx', 'utf8');

code = code.replace(
  "onBack={() => { setSelectedAlbum(null); setSelectedArtist(null); }}",
  "onBack={() => { setSelectedAlbum(null); setSelectedArtist(null); }}\n              onRemoveTrack={libraryMode === 'descargados' ? removeTrack : undefined}"
);

fs.writeFileSync('src/components/LibraryTab.tsx', code);
