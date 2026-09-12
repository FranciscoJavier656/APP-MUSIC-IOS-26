const fs = require('fs');
let code = fs.readFileSync('src/components/PlayerContext.tsx', 'utf8');
code = code.replace(/audio\.crossOrigin > "anonymous";/g, 'audio.crossOrigin = "anonymous";');
fs.writeFileSync('src/components/PlayerContext.tsx', code);
console.log('done');
