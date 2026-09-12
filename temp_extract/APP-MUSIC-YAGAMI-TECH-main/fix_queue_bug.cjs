const fs = require('fs');
let code = fs.readFileSync('src/components/PlayerContext.tsx', 'utf8');
code = code.replace('if (queue.length = 0) {', 'if (queue.length > 0) {');
fs.writeFileSync('src/components/PlayerContext.tsx', code);
console.log("Bug fixed");
