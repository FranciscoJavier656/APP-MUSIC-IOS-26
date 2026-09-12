const fs = require('fs');
let code = fs.readFileSync('src/components/PlayerContext.tsx', 'utf8');

const target = `export interface Track {`;
const replacement = `export interface Track {
  album?: any;`;

if(code.includes(target) && !code.includes('album?: any;')) {
  code = code.replace(target, replacement);
  fs.writeFileSync('src/components/PlayerContext.tsx', code);
  console.log("Fixed Track interface");
} else {
  console.log("Already fixed or target not found");
}
