const fs = require('fs');
const path = 'src/components/MiniPlayer.tsx';
let content = fs.readFileSync(path, 'utf8');

// The native Tab Bar with padding and safe area reaches about 122px from the bottom.
// We need the MiniPlayer to sit above it. 
// bottom: calc(96px + env(safe-area-inset-bottom))
content = content.replace(/className="absolute bottom-\[calc\(.*?\)\] left-3 right-3 z-40"/g, 'className="absolute bottom-[calc(96px+env(safe-area-inset-bottom))] left-3 right-3 z-40"');

fs.writeFileSync(path, content);
console.log("Updated MiniPlayer positioning");
