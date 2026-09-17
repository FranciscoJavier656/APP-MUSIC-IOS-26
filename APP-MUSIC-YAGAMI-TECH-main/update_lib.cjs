const fs = require('fs');
let code = fs.readFileSync('src/components/LibraryTab.tsx', 'utf8');

code = code.replace(
  "const { playTrack } = usePlayer();",
  "const { playTrack, setContextMenuTrack } = usePlayer();"
);

code = code.replace(
  "document.dispatchEvent(new CustomEvent('open-context-menu', { detail: { track: item.original, event: e } }));",
  "setContextMenuTrack(item.original);"
);

fs.writeFileSync('src/components/LibraryTab.tsx', code);
