const fs = require('fs');
let code = fs.readFileSync('src/components/ExpandedPlayer.tsx', 'utf8');

code = code.replace(
  /img\.src = currentTrack\.image;/g,
  "img.src = getImageSrc(currentTrack.image) || '';"
);

fs.writeFileSync('src/components/ExpandedPlayer.tsx', code);
console.log("Patched ExpandedPlayer.tsx");
