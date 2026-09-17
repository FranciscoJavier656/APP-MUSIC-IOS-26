const fs = require('fs');
let code = fs.readFileSync('src/components/ExpandedPlayer.tsx', 'utf8');

// 1. Remove onClick from outer motion.div
code = code.replace(
  /onClick=\{\(\) => \{ if \(\!showLyrics\) setShowLyrics\(true\); \}\}/g,
  ''
);

// 2. Add onClick to Front (Image)
const frontFaceRegex = /<div\s+className="absolute inset-0 rounded-3xl overflow-hidden shadow-inner cursor-pointer"\s+style=\{\{\s*backfaceVisibility:\s*'hidden'\s*\}\}\s*>/g;
code = code.replace(frontFaceRegex, `<div onClick={() => setShowLyrics(true)} className="absolute inset-0 rounded-3xl overflow-hidden shadow-inner cursor-pointer" style={{ backfaceVisibility: 'hidden', pointerEvents: showLyrics ? 'none' : 'auto' }}>`);

// 3. Add onClick to Back (Lyrics)
const backFaceRegex = /<div\s+className="absolute inset-0 rounded-3xl overflow-hidden border border-white\/20 bg-gray-900"\s+style=\{\{\s*backfaceVisibility:\s*'hidden',\s*transform:\s*'rotateY\\(180deg\\)',\s*pointerEvents:\s*showLyrics \? 'auto' : 'none'\s*\}\}\s*>/g;
code = code.replace(backFaceRegex, `<div 
            onClick={() => setShowLyrics(false)}
            className="absolute inset-0 rounded-3xl overflow-hidden border border-white/20 bg-gray-900 cursor-pointer"
            style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)', pointerEvents: showLyrics ? 'auto' : 'none' }}
          >`);

// 4. Add stopPropagation to the scroll container so tapping text doesn't flip it
const scrollContainerRegex = /<div onTouchMove=\{\(e\) => e\.stopPropagation\(\)\}\s+className="overflow-y-auto flex-1 text-center"/g;
code = code.replace(scrollContainerRegex, `<div onClick={(e) => e.stopPropagation()} onTouchMove={(e) => e.stopPropagation()} className="overflow-y-auto flex-1 text-center cursor-default"`);

fs.writeFileSync('src/components/ExpandedPlayer.tsx', code);
console.log("Flip logic re-implemented correctly.");
