const fs = require('fs');
let code = fs.readFileSync('src/components/SearchTab.tsx', 'utf8');

// Searching should trigger searchQobuz and render albums/playlists.
// The click handlers there are:
// <div key={playlist.id} className="..." onClick={() => console.log('Open playlist', playlist.id)}>
// We need to fix those too.
code = code.replace(/onClick=\{\(\)\s*=>\s*console\.log\([^)]+\)\}/g, 
  (match) => {
    if (match.includes('playlist')) {
       return "onClick={() => setActiveItem({id: playlist.id, type: 'playlist'})}";
    }
    return match;
  }
);

fs.writeFileSync('src/components/SearchTab.tsx', code);
