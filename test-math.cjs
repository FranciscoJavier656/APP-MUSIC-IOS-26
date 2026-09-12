const fs = require('fs');
let code = fs.readFileSync('src/components/ExpandedPlayer.tsx', 'utf8');

code = code.replace(
  `className="relative h-full max-h-[320px] sm:max-h-[400px] aspect-square rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.3)] transition-transform duration-1000 ease-[cubic-bezier(0.19,1,0.22,1)] cursor-pointer"`,
  `className="relative aspect-square rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.3)] transition-transform duration-1000 ease-[cubic-bezier(0.19,1,0.22,1)] cursor-pointer"\n          style={{ width: '100%', maxWidth: 'min(400px, 65dvh)', transformStyle: 'preserve-3d', transform: showLyrics ? 'rotateY(180deg) scale(0.95)' : 'rotateY(0deg) scale(1)' }}`
);

fs.writeFileSync('src/components/ExpandedPlayer.tsx', code);
