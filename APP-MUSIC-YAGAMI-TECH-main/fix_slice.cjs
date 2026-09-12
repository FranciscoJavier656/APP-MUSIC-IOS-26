const fs = require('fs');
let code = fs.readFileSync('src/components/SearchTab.tsx', 'utf8');

code = code.replace(
  /results\.albums\.items\.slice\(0,\s*filterMode === 'albums' \? 50 : 8\)/g,
  "results.albums.items.slice(0, filterMode === 'albums' ? undefined : 8)"
);

code = code.replace(
  /results\.artists\.items\.slice\(0,\s*filterMode === 'artists' \? 50 : 6\)/g,
  "results.artists.items.slice(0, filterMode === 'artists' ? undefined : 6)"
);

code = code.replace(
  /results\.tracks\.items\.slice\(0,\s*filterMode === 'tracks' \? 50 : 5\)/g,
  "results.tracks.items.slice(0, filterMode === 'tracks' ? undefined : 5)"
);

fs.writeFileSync('src/components/SearchTab.tsx', code);
