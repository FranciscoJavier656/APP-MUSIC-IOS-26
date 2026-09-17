const fs = require('fs');
let code = fs.readFileSync('src/components/ExpandedPlayer.tsx', 'utf8');

// Add import for Haptics
code = code.replace(
  "import { Capacitor } from '@capacitor/core';",
  "import { Capacitor } from '@capacitor/core';\nimport { Haptics, ImpactStyle } from '@capacitor/haptics';"
);

// Replace Prev Button
const prevRegex = /<button\s+onClick=\{prevTrack\}\s+className="p-3 text-black dark:text-white hover:opacity-70 transition-opacity"\s*>\s*<SkipBack className="w-8 h-8 fill-current" \/>\s*<\/button>/;
const prevNew = `<motion.button 
            whileTap={{ scale: 0.8 }}
            onClick={() => { Haptics.impact({ style: ImpactStyle.Light }); prevTrack(); }}
            className="p-3 text-black dark:text-white"
          >
            <SkipBack className="w-8 h-8 fill-current" />
          </motion.button>`;
code = code.replace(prevRegex, prevNew);

// Replace Next Button
const nextRegex = /<button\s+onClick=\{nextTrack\}\s+className="p-3 text-black dark:text-white hover:opacity-70 transition-opacity"\s*>\s*<SkipForward className="w-8 h-8 fill-current" \/>\s*<\/button>/;
const nextNew = `<motion.button 
            whileTap={{ scale: 0.8 }}
            onClick={() => { Haptics.impact({ style: ImpactStyle.Light }); nextTrack(); }}
            className="p-3 text-black dark:text-white"
          >
            <SkipForward className="w-8 h-8 fill-current" />
          </motion.button>`;
code = code.replace(nextRegex, nextNew);

// Replace Play/Pause Button
const playRegex = /<button\s+onClick=\{togglePlay\}\s+className="w-20 h-20 flex items-center justify-center text-white rounded-full hover:scale-105 active:scale-95 transition-all shadow-lg"\s+style=\{\{ backgroundColor: dominantColor \|\| \(window\.matchMedia\('\(prefers-color-scheme: dark\)'\)\.matches \? 'white' : 'black'\), color: dominantColor \? '#fff' : \(window\.matchMedia\('\(prefers-color-scheme: dark\)'\)\.matches \? 'black' : 'white'\) \}\}\s*>\s*\{isPlaying \? \(\s*<Pause className="w-8 h-8 fill-current" \/>\s*\) : \(\s*<Play className="w-8 h-8 fill-current translate-x-1" \/>\s*\)\}\s*<\/button>/;

const playNew = `<motion.button 
            whileTap={{ scale: 0.85 }}
            onClick={() => { Haptics.impact({ style: ImpactStyle.Medium }); togglePlay(); }}
            className="w-20 h-20 flex items-center justify-center text-white rounded-full shadow-lg"
            style={{ backgroundColor: dominantColor || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'white' : 'black'), color: dominantColor ? '#fff' : (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'black' : 'white') }}
          >
            <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor" style={{ marginLeft: isPlaying ? '0' : '4px' }} className="transition-all duration-300">
              <motion.path
                animate={{
                  d: isPlaying 
                    ? "M 6 4 L 10 4 L 10 20 L 6 20 Z" 
                    : "M 5 3 L 12 7.5 L 12 16.5 L 5 21 Z"
                }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
              />
              <motion.path
                animate={{
                  d: isPlaying 
                    ? "M 14 4 L 18 4 L 18 20 L 14 20 Z" 
                    : "M 12 7.5 L 19 12 L 19 12 L 12 16.5 Z"
                }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
              />
            </svg>
          </motion.button>`;
code = code.replace(playRegex, playNew);

fs.writeFileSync('src/components/ExpandedPlayer.tsx', code);
console.log("Controls updated.");
