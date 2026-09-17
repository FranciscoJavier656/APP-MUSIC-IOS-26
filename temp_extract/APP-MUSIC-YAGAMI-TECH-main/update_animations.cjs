const fs = require('fs');

// 1. MiniPlayer.tsx changes
let miniCode = fs.readFileSync('src/components/MiniPlayer.tsx', 'utf8');

miniCode = miniCode.replace(
  /<div className="w-12 h-12 rounded-\[12px\] overflow-hidden shadow-md flex-shrink-0 relative bg-gray-200 dark:bg-gray-800">/,
  '<motion.div layoutId="player-artwork" className="w-12 h-12 rounded-[12px] overflow-hidden shadow-md flex-shrink-0 relative bg-gray-200 dark:bg-gray-800">'
);
miniCode = miniCode.replace(
  /<\/div>\s*\{\/\* Track Info \*\/\}/,
  '</motion.div>\n                {/* Track Info */}'
);
miniCode = miniCode.replace(
  /<AnimatePresence>\s*\{currentTrack && \(/,
  '<AnimatePresence>\n        {currentTrack && !isExpanded && ('
);
fs.writeFileSync('src/components/MiniPlayer.tsx', miniCode);


// 2. ExpandedPlayer.tsx changes
let expandedCode = fs.readFileSync('src/components/ExpandedPlayer.tsx', 'utf8');

// Ensure motion is imported
if (!expandedCode.includes('import { motion')) {
  expandedCode = expandedCode.replace("import React,", "import { motion, AnimatePresence } from 'motion/react';\nimport React,");
}

expandedCode = expandedCode.replace(
  /<div\s+onTouchStart=\{handleTouchStart\}[\s\S]*?style=\{\{ transform: isExpanded \?[\s\S]*?translateY\(100%\)' \}\}\s*>/,
  `<AnimatePresence>
      {isExpanded && (
        <motion.div
          initial={{ y: "100%", opacity: 0 }}
          animate={{ y: touchOffsetY > 0 ? touchOffsetY : 0, opacity: 1 }}
          exit={{ y: "100%", opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 250 }}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          className="fixed inset-0 z-[60] bg-[#F2F2F7] dark:bg-[#000000] flex flex-col pt-12 pb-8 px-6 sm:px-12"
        >`
);

expandedCode = expandedCode.replace(
  /className="relative aspect-square rounded-3xl shadow-\[0_20px_50px_rgba\(0,0,0,0\.3\)\] transition-transform duration-1000 ease-\[cubic-bezier\(0\.19,1,0\.22,1\)\] cursor-pointer"/,
  `layoutId="player-artwork"
          className="relative aspect-square rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.3)] transition-transform duration-1000 ease-[cubic-bezier(0.19,1,0.22,1)] cursor-pointer"`
);

// We need to change the <div> for artwork to <motion.div>
expandedCode = expandedCode.replace(
  /<div\s+layoutId="player-artwork"/,
  '<motion.div \n          layoutId="player-artwork"'
);

expandedCode = expandedCode.replace(
  /<\/div>\s*\{\/\* Lyrics Front \*\/\}/,
  '</motion.div>\n          {/* Lyrics Front */}'
);

// Now wrap the very end of ExpandedPlayer.tsx with closing tags for AnimatePresence
expandedCode = expandedCode.replace(
  /      <\/div>\n    <\/div>\n  \);\n\}\n$/,
  '      </div>\n    </motion.div>\n      )}\n    </AnimatePresence>\n  );\n}\n'
);

fs.writeFileSync('src/components/ExpandedPlayer.tsx', expandedCode);
