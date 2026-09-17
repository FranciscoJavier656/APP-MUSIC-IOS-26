const fs = require('fs');
let code = fs.readFileSync('src/components/HomeTab.tsx', 'utf8');

code = code.replace(
  'onClick={() => setActiveItem({id: "7802330", type: "playlist"})}',
  'onClick={() => setActiveItem({id: (playlists[0]?.id || "1752421").toString(), type: "playlist"})}'
);

code = code.replace(
  'onClick={() => setActiveItem({id: "68995736", type: "playlist"})}',
  'onClick={() => setActiveItem({id: (playlists[1]?.id || "1752421").toString(), type: "playlist"})}'
);

fs.writeFileSync('src/components/HomeTab.tsx', code);
