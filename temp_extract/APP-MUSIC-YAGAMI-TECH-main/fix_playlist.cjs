const fs = require('fs');
let code = fs.readFileSync('src/components/PlaylistView.tsx', 'utf8');
code = code.replace(/<p = Cargando/g, "<p>Cargando");
code = code.replace(/<p=\{error\}<\/p>/g, "<p>{error}</p>");
code = code.replace(/maximum_bit_depth = 16/g, "maximum_bit_depth > 16");
fs.writeFileSync('src/components/PlaylistView.tsx', code);
