const fs = require('fs');
let code = fs.readFileSync('src/components/ExpandedPlayer.tsx', 'utf8');

code = code.replace(
  "const remoteUrl = getImageSrc(currentTrack?.album?.image || currentTrack?.image);",
  "const remoteUrl = getImageSrc(currentTrack?.album?.image || currentTrack?.image || currentTrack?.original?.album?.image || currentTrack?.original?.image);"
);

fs.writeFileSync('src/components/ExpandedPlayer.tsx', code);
console.log('done');
