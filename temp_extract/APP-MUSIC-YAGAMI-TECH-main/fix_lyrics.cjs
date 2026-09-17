const fs = require('fs');
let code = fs.readFileSync('src/components/ExpandedPlayer.tsx', 'utf8');

const badUrl = '`https://lrclib.net/api/search?track_name>${encodeURIComponent(currentTrack.title)}&artist_name>${encodeURIComponent(currentTrack.artist)}`';
const goodUrl = '`https://lrclib.net/api/search?track_name=${encodeURIComponent(currentTrack.title)}&artist_name=${encodeURIComponent(currentTrack.artist)}`';

if (code.includes(badUrl)) {
  code = code.replace(badUrl, goodUrl);
  fs.writeFileSync('src/components/ExpandedPlayer.tsx', code);
  console.log("Fixed LRCLIB url");
} else {
  console.log("URL not found or already fixed.");
}
