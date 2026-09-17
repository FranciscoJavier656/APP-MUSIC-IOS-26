const fs = require('fs');
let code = fs.readFileSync('src/components/ExpandedPlayer.tsx', 'utf8');

// 1. Add onClick back to the motion.div
const motionDivRegex = /<motion\.div\s+layoutId="player-artwork"\s+className="relative aspect-square rounded-3xl shadow-\[0_20px_50px_rgba\(0,0,0,0\.3\)\] transition-transform duration-1000 ease-\[cubic-bezier\(0\.19,1,0\.22,1\)\] cursor-pointer"\s+style=\{\{([\s\S]*?)\}\}\s*>/;

code = code.replace(motionDivRegex, (match, styleContent) => {
  return `<motion.div 
          layoutId="player-artwork"
          className="relative aspect-square rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.3)] transition-transform duration-1000 ease-[cubic-bezier(0.19,1,0.22,1)] cursor-pointer"
          style={{${styleContent}}}
          onClick={() => { if (!showLyrics) setShowLyrics(true); }}
        >`;
});

// 2. Remove onClick from the Front face
const frontFaceRegex = /<div onClick=\{\(\) => setShowLyrics\(true\)\} className="absolute inset-0 rounded-3xl overflow-hidden shadow-inner cursor-pointer" style=\{\{ backfaceVisibility: 'hidden' \}\}>/;
code = code.replace(frontFaceRegex, `<div className="absolute inset-0 rounded-3xl overflow-hidden shadow-inner cursor-pointer" style={{ backfaceVisibility: 'hidden' }}>`);

// 3. Add pointerEvents logic to the Back face
const backFaceRegex = /<div\s+className="absolute inset-0 rounded-3xl overflow-hidden border border-white\/20 bg-gray-900"\s+style=\{\{ backfaceVisibility: 'hidden', transform: 'rotateY\(180deg\)' \}\}\s*>/;
code = code.replace(backFaceRegex, `<div 
            className="absolute inset-0 rounded-3xl overflow-hidden border border-white/20 bg-gray-900"
            style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)', pointerEvents: showLyrics ? 'auto' : 'none' }}
          >`);

fs.writeFileSync('src/components/ExpandedPlayer.tsx', code);
console.log("Flip final fix applied.");
