const fs = require('fs');
let code = fs.readFileSync('src/components/SearchTab.tsx', 'utf8');

// There might also be Album items that don't use setActiveAlbum anymore.
code = code.replace(/onClick=\{\(\)\s*=>\s*setActiveAlbum\(([^)]+)\)\}/g, "onClick={() => setActiveItem({id: $1, type: 'album'})}");
fs.writeFileSync('src/components/SearchTab.tsx', code);
