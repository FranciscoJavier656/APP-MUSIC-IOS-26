const fs = require('fs');
let code = fs.readFileSync('src/components/ArtistView.tsx', 'utf8');

code = code.replace(
  /topTracks\.slice\(0,\s*10\)/g,
  "topTracks"
);

fs.writeFileSync('src/components/ArtistView.tsx', code);
