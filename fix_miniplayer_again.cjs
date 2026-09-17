const fs = require('fs');
const path = 'src/components/MiniPlayer.tsx';
let content = fs.readFileSync(path, 'utf8');

// The MiniPlayer is still too low in the screenshot. It's overlapping the native bar.
// Let's force it much higher up.
content = content.replace(/className="absolute bottom-\[calc\(96px\+env\(safe-area-inset-bottom\)\)\] left-3 right-3 z-40"/g, 'className="absolute bottom-[calc(110px+env(safe-area-inset-bottom))] left-3 right-3 z-40"');

fs.writeFileSync(path, content);
console.log("Updated MiniPlayer positioning");
