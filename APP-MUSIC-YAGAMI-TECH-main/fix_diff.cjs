const fs = require('fs');

const fixPlayer = 'src/components/ExpandedPlayer.tsx';
if (fs.existsSync(fixPlayer)) {
  let code = fs.readFileSync(fixPlayer, 'utf8');
  code = code.replace(/diff = 0/g, 'diff > 0');
  code = code.replace(/touchOffsetY = 120/g, 'touchOffsetY > 120');
  code = code.replace(/touchOffsetY = 0/g, 'touchOffsetY > 0');
  code = code.replace(/dur = 0/g, 'dur > 0');
  fs.writeFileSync(fixPlayer, code);
}

const fixSwipe = 'src/lib/useSwipeBack.ts';
if (fs.existsSync(fixSwipe)) {
  let code = fs.readFileSync(fixSwipe, 'utf8');
  code = code.replace(/diffX = 60/g, 'diffX > 60');
  fs.writeFileSync(fixSwipe, code);
}

