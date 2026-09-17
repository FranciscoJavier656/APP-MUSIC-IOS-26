const fs = require('fs');
let code = fs.readFileSync('src/components/ExpandedPlayer.tsx', 'utf8');

code = code.replace(
  "currentTrack, isPlaying, togglePlay,",
  "currentTrack, isPlaying, togglePlay, playTrack,"
);

const oldDiv = `<div key={idx} className={\`flex items-center gap-4 p-3 rounded-2xl \${isPlayingQueue ? 'bg-black/5 dark:bg-white/10' : ''}\`}>`;
const newDiv = `<div key={idx} onClick={() => playTrack(track)} className={\`flex items-center gap-4 p-3 rounded-2xl cursor-pointer hover:bg-black/5 dark:hover:bg-white/10 transition-colors \${isPlayingQueue ? 'bg-black/5 dark:bg-white/10' : ''}\`}>`;

if(code.includes(oldDiv)) {
  code = code.replace(oldDiv, newDiv);
  fs.writeFileSync('src/components/ExpandedPlayer.tsx', code);
  console.log("Success ExpandedPlayer");
} else {
  console.log("Failed to find oldDiv");
}
