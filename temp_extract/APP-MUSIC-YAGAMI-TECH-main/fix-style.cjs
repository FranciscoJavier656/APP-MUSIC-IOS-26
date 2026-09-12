const fs = require('fs');
let code = fs.readFileSync('src/components/ExpandedPlayer.tsx', 'utf8');

code = code.replace(
  `          style={{ width: '100%', maxWidth: 'min(400px, 65dvh)', transformStyle: 'preserve-3d', transform: showLyrics ? 'rotateY(180deg) scale(0.95)' : 'rotateY(0deg) scale(1)' }}\n          style={{ transformStyle: 'preserve-3d', transform: showLyrics ? 'rotateY(180deg) scale(0.95)' : 'rotateY(0deg) scale(1)' }}`,
  `          style={{ width: '100%', maxWidth: 'min(400px, 50dvh)', transformStyle: 'preserve-3d', transform: showLyrics ? 'rotateY(180deg) scale(0.95)' : 'rotateY(0deg) scale(1)' }}`
);

fs.writeFileSync('src/components/ExpandedPlayer.tsx', code);
