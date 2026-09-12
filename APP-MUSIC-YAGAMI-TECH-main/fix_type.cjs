const fs = require('fs');
let code = fs.readFileSync('src/components/PlayerContext.tsx', 'utf8');

code = code.replace(/'album'\|'track'\|'playlist'/g, "'album'|'track'|'playlist'|'artist'");

fs.writeFileSync('src/components/PlayerContext.tsx', code);
