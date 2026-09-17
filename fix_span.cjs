const fs = require('fs');
let code = fs.readFileSync('src/components/ExpandedPlayer.tsx', 'utf8');
code = code.replace(/<span = /g, "<span>");
fs.writeFileSync('src/components/ExpandedPlayer.tsx', code);
