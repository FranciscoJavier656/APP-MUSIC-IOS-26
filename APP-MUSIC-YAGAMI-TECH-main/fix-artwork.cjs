const fs = require('fs');
let code = fs.readFileSync('src/components/ExpandedPlayer.tsx', 'utf8');

const target = `className="relative w-full max-w-[min(320px,55dvh)] sm:max-w-[min(400px,55dvh)] aspect-square rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.3)] transition-transform duration-1000 ease-[cubic-bezier(0.19,1,0.22,1)] cursor-pointer"
          style={{ transformStyle: 'preserve-3d', transform: showLyrics ? 'rotateY(180deg) scale(0.95)' : 'rotateY(0deg) scale(1)' }}`;

const replacement = `className="relative aspect-square rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.3)] transition-transform duration-1000 ease-[cubic-bezier(0.19,1,0.22,1)] cursor-pointer"
          style={{ 
            width: 'min(100%, 45vh, 380px)',
            height: 'min(100%, 45vh, 380px)',
            transformStyle: 'preserve-3d', 
            transform: showLyrics ? 'rotateY(180deg) scale(0.95)' : 'rotateY(0deg) scale(1)' 
          }}`;

if (code.includes(target)) {
  code = code.replace(target, replacement);
  fs.writeFileSync('src/components/ExpandedPlayer.tsx', code);
  console.log("Fixed successfully.");
} else {
  console.log("Target string not found. Please review ExpandedPlayer.tsx");
}
