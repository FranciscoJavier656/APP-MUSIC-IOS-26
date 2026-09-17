const fs = require('fs');
let code = fs.readFileSync('src/components/SearchTab.tsx', 'utf8');

code = code.replace(
  "const loadedTracks = (currentOffset === 0 ? 0 : offset) + (data.tracks?.items?.length || 0);",
  "const loadedTracks = currentOffset + (data.tracks?.items?.length || 0);"
);

fs.writeFileSync('src/components/SearchTab.tsx', code);
