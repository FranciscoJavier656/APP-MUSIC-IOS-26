const fs = require('fs');
let code = fs.readFileSync('src/components/ExpandedPlayer.tsx', 'utf8');

// Add LYRICS_OFFSET
const lyricsOffsetLogic = `// 1.5 Update Synced Lyrics
          if (parsedLyricsRef.current && lyricsContainerRef.current) {
            const lyricsArray = parsedLyricsRef.current;
            const LYRICS_OFFSET = 0.4; // advance lyrics by 400ms
            const adjustedCurrent = current + LYRICS_OFFSET;
            let activeIdx = -1;
            for (let i = 0; i < lyricsArray.length; i++) {
                if (adjustedCurrent >= lyricsArray[i].time) {
                    activeIdx = i;
                } else {
                    break;
                }
            }`;

code = code.replace(/\/\/ 1\.5 Update Synced Lyrics\s*if \(parsedLyricsRef\.current && lyricsContainerRef\.current\) \{\s*const lyricsArray = parsedLyricsRef\.current;\s*let activeIdx = -1;\s*for \(let i = 0; i < lyricsArray\.length; i\+\+\) \{\s*if \(current >= lyricsArray\[i\]\.time\) \{\s*activeIdx = i;\s*\} else \{\s*break;\s*\}\s*\}/, lyricsOffsetLogic);

const percentLogicOld = `let percent = ((current - activeLine.time) / activeLine.duration);`;
const percentLogicNew = `let percent = ((adjustedCurrent - activeLine.time) / activeLine.duration);`;
code = code.replace(percentLogicOld, percentLogicNew);

fs.writeFileSync('src/components/ExpandedPlayer.tsx', code);
console.log("Lyrics offset applied.");
