const fs = require('fs');
let code = fs.readFileSync('src/components/ExpandedPlayer.tsx', 'utf8');

// Find useEffect that fetches lyrics
const lyricsFetchEffect = /useEffect\(\(\) => \{\n\s*if \(currentTrack && showLyrics\) \{/;
const resetEffect = `  useEffect(() => {
    setShowLyrics(false);
  }, [currentTrack?.id || currentTrack?.title]);

  useEffect(() => {
    if (currentTrack && showLyrics) {`;

code = code.replace(lyricsFetchEffect, resetEffect);
fs.writeFileSync('src/components/ExpandedPlayer.tsx', code);
