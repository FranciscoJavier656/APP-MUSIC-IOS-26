const fs = require('fs');
let code = fs.readFileSync('src/components/ExpandedPlayer.tsx', 'utf8');
code = code.replace(/img.onload > \(\) =>/g, "img.onload = () =>");
code = code.replace(/img.crossOrigin > 'Anonymous'/g, "img.crossOrigin = 'Anonymous'");
fs.writeFileSync('src/components/ExpandedPlayer.tsx', code);
