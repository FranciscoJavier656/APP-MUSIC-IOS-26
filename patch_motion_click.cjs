const fs = require('fs');
let code = fs.readFileSync('src/components/ExpandedPlayer.tsx', 'utf8');

code = code.replace(
  /onClick=\{\(\) => setShowLyrics\(!showLyrics\)\}/,
  `onClick={() => { if (!showLyrics) setShowLyrics(true); }}`
);

fs.writeFileSync('src/components/ExpandedPlayer.tsx', code);
console.log("Motion div click fixed.");
