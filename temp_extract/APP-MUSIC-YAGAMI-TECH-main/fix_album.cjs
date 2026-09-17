const fs = require('fs');
let code = fs.readFileSync('src/components/AlbumView.tsx', 'utf8');
code = code.replace(/<p = Cargando/g, "<p>Cargando");
fs.writeFileSync('src/components/AlbumView.tsx', code);
