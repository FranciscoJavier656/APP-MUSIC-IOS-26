const fs = require('fs');
let code = fs.readFileSync('src/components/HomeTab.tsx', 'utf8');

code = code.replace(
  '].map((cat) => (\n                  <div key={cat.title} onClick={() => setActiveItem({id: (playlists[1]?.id || "1752421").toString(), type: "playlist"})}',
  '].map((cat, i) => (\n                  <div key={cat.title} onClick={() => setActiveItem({id: (playlists[i + 5]?.id || "1752421").toString(), type: "playlist"})}'
);

fs.writeFileSync('src/components/HomeTab.tsx', code);
