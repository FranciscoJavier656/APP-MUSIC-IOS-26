const fs = require('fs');

let code = fs.readFileSync('src/components/LibraryTab.tsx', 'utf8');

// We have two places with onClick in LibraryTab.tsx (one for the image, one for the text)
code = code.replace(
  /onClick=\{\(\) => \{\n\s*if \(item\.type === 'album'\) setSelectedAlbum\(item\);\n\s*if \(item\.type === 'artist'\) setSelectedArtist\(item\);\n\s*\}\}/g,
  `onClick={() => {
    if (libraryMode === 'streaming') {
      if (item.type === 'album') document.dispatchEvent(new CustomEvent('open-overlay', { detail: { type: 'album', id: item.id } }));
      if (item.type === 'artist') document.dispatchEvent(new CustomEvent('open-overlay', { detail: { type: 'artist', id: item.id } }));
      if (item.type === 'playlist') document.dispatchEvent(new CustomEvent('open-overlay', { detail: { type: 'playlist', id: item.id } }));
    } else {
      if (item.type === 'album') setSelectedAlbum(item);
      if (item.type === 'artist') setSelectedArtist(item);
    }
  }}`
);

fs.writeFileSync('src/components/LibraryTab.tsx', code);
