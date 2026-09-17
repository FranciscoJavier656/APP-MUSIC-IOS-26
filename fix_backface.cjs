const fs = require('fs');
let code = fs.readFileSync('src/components/ExpandedPlayer.tsx', 'utf8');

const backFaceSearch = `<div 
            className="absolute inset-0 rounded-3xl overflow-hidden border border-white/20 bg-gray-900"
            style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)', pointerEvents: showLyrics ? 'auto' : 'none' }}
          >`;
const backFaceReplace = `<div 
            onClick={() => setShowLyrics(false)}
            className="absolute inset-0 rounded-3xl overflow-hidden border border-white/20 bg-gray-900 cursor-pointer"
            style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)', pointerEvents: showLyrics ? 'auto' : 'none' }}
          >`;

if (code.includes(backFaceSearch)) {
  code = code.replace(backFaceSearch, backFaceReplace);
  fs.writeFileSync('src/components/ExpandedPlayer.tsx', code);
  console.log("Backface updated.");
} else {
  console.log("Not found.");
}
