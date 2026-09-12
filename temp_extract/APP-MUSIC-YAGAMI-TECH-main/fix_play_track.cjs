const fs = require('fs');
let code = fs.readFileSync('src/components/PlayerContext.tsx', 'utf8');

const oldPlay = `const playTrack = async (rawTrack: any, newQueue?: Track[]) => {`;
const newPlay = `const playTrack = async (rawTrack: any, newQueue?: Track[]) => {
    if (!rawTrack) return;`;

if(code.includes(oldPlay)) {
  code = code.replace(oldPlay, newPlay);
  fs.writeFileSync('src/components/PlayerContext.tsx', code);
  console.log("Success playTrack");
}
