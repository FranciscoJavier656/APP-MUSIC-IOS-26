const fs = require('fs');
let code = fs.readFileSync('src/components/SearchTab.tsx', 'utf8');

// There might be a click handler that's console.logging Open album
code = code.replace(/onClick=\{\(\)\s*=>\s*console\.log\('Open album',\s*album\.id\)\}/g, "onClick={() => setActiveItem({id: album.id, type: 'album'})}");

fs.writeFileSync('src/components/SearchTab.tsx', code);
