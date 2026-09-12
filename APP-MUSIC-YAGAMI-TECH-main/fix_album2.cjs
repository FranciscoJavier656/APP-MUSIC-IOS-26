const fs = require('fs');
let code = fs.readFileSync('src/components/AlbumView.tsx', 'utf8');
code = code.replace(/<p=\{error\}<\/p>/g, "<p>{error}</p>");
fs.writeFileSync('src/components/AlbumView.tsx', code);
