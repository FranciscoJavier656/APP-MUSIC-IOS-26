const fs = require('fs');
let code = fs.readFileSync('src/components/PlayerContext.tsx', 'utf8');

const target = `export interface Track {
  local_path?: string;
  id: string;`;

const replacement = `export interface Track {
  local_path?: string;
  streamUrl?: string;
  id: string;`;

if (code.includes(target)) {
  fs.writeFileSync('src/components/PlayerContext.tsx', code.replace(target, replacement));
  console.log("Patched Track interface");
} else {
  console.log("Target not found in Track interface");
}
