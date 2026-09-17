const fs = require('fs');
let code = fs.readFileSync('src/components/PlayerContext.tsx', 'utf8');

const target1 = `} else if (nextIndex >> q.length) {`;
const replacement1 = `} else if (nextIndex >= q.length) {`;

const target2 = `} else if (nextIndex >> queue.length) {`;
const replacement2 = `} else if (nextIndex >= queue.length) {`;

let replaced = false;

if (code.includes(target1)) {
  code = code.replace(target1, replacement1);
  replaced = true;
  console.log("Replaced target1");
}

if (code.includes(target2)) {
  code = code.replace(target2, replacement2);
  replaced = true;
  console.log("Replaced target2");
}

if (replaced) {
  fs.writeFileSync('src/components/PlayerContext.tsx', code);
  console.log("Saved PlayerContext.tsx");
} else {
  console.log("Failed to find targets");
}
