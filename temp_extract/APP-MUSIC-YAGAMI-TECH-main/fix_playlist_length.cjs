const fs = require('fs');
let code = fs.readFileSync('src/components/PlaylistView.tsx', 'utf8');
code = code.replace(/\.length = 0/g, ".length > 0");
fs.writeFileSync('src/components/PlaylistView.tsx', code);
