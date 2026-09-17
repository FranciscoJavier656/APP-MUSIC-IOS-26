const fs = require('fs');
let code = fs.readFileSync('src/components/ExpandedPlayer.tsx', 'utf8');

const regex = /<motion\.div\s+layoutId="player-artwork"\s+className="relative aspect-square rounded-3xl shadow-\[0_20px_50px_rgba\(0,0,0,0\.3\)\] transition-transform duration-1000 ease-\[cubic-bezier\(0\.19,1,0\.22,1\)\] cursor-pointer"\s+style=\{\{\s*width:\s*'min\(100%, 45vh, 380px\)',\s*height:\s*'min\(100%, 45vh, 380px\)',\s*transformStyle:\s*'preserve-3d',\s*transform:\s*showLyrics \? 'rotateY\(180deg\) scale\(0\.95\)' : 'rotateY\(0deg\) scale\(1\)'\s*\}\}\s*>/;

const replacement = `<motion.div 
          layoutId="player-artwork"
          className="relative aspect-square rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.3)] cursor-pointer"
          style={{ 
            width: 'min(100%, 45vh, 380px)',
            height: 'min(100%, 45vh, 380px)',
            transformStyle: 'preserve-3d'
          }}
          animate={{
            rotateY: showLyrics ? 180 : 0,
            scale: showLyrics ? 0.95 : 1
          }}
          transition={{
            duration: 1,
            ease: [0.19, 1, 0.22, 1]
          }}
        >`;

code = code.replace(regex, replacement);
fs.writeFileSync('src/components/ExpandedPlayer.tsx', code);
console.log("Framer motion fix applied.");
