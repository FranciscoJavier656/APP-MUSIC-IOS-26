const fs = require('fs');
let code = fs.readFileSync('src/components/ExpandedPlayer.tsx', 'utf8');

const badParentClick = `onClick={() => { if (!showLyrics) setShowLyrics(true); }}`;
code = code.replace(badParentClick, '');

const badFront = `<div className="absolute inset-0 rounded-3xl overflow-hidden shadow-inner" style={{ backfaceVisibility: 'hidden' }}>`;
const goodFront = `<div onClick={() => setShowLyrics(true)} className="absolute inset-0 rounded-3xl overflow-hidden shadow-inner cursor-pointer" style={{ backfaceVisibility: 'hidden' }}>`;
code = code.replace(badFront, goodFront);

// Also remove the stopPropagation stuff on the lyrics side as it's no longer strictly needed but we can keep it on the button for safety
const badLyricsScroll = `<div onClick={(e) => e.stopPropagation()} onTouchMove={(e) => e.stopPropagation()} className="overflow-y-auto flex-1 text-center"`;
const goodLyricsScroll = `<div onTouchMove={(e) => e.stopPropagation()} className="overflow-y-auto flex-1 text-center"`;
code = code.replace(badLyricsScroll, goodLyricsScroll);

fs.writeFileSync('src/components/ExpandedPlayer.tsx', code);
console.log("Flipping logic fixed.");
