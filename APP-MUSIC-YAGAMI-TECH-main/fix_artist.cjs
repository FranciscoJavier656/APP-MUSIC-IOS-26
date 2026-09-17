const fs = require('fs');
let code = fs.readFileSync('src/components/ArtistView.tsx', 'utf8');
code = code.replace(/\\\`/g, '`');
fs.writeFileSync('src/components/ArtistView.tsx', code);
