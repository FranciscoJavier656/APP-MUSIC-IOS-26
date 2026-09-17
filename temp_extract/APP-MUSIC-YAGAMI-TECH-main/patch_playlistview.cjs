const fs = require('fs');

const staggerVariants = `
  const containerVariants = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.05 } } };
  const itemVariants = { hidden: { opacity: 0, y: 15 }, show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 400, damping: 30 } } };
`;

let code = fs.readFileSync('src/components/PlaylistView.tsx', 'utf8');

if (!code.includes('containerVariants')) {
  code = code.replace(
    /export default function PlaylistView\(\{ playlistId, onBack \}: \{ playlistId: string, onBack: \(\) => void \}\) \{/,
    match => match + staggerVariants
  );
}

if (!code.includes('import { motion }')) {
  code = code.replace("import React,", "import { motion } from 'motion/react';\nimport React,");
}

code = code.replace(
  /<div className="space-y-1">\s*\{playlist\.tracks\?\.items\?\.map\(\(track: any, index: number\) => \(/,
  '<motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-1">\n            {playlist.tracks?.items?.map((track: any, index: number) => ('
);

code = code.replace(
  /<div \s*key=\{track\.id \+ '-' \+ index\} \s*onClick=\{\(\) => handlePlay\(track\)\} \s*className="flex items-center space-x-4 p-3 rounded-xl hover:bg-black\/5 dark:hover:bg-white\/5 transition-colors group cursor-pointer"\s*>/g,
  '<motion.div variants={itemVariants} key={track.id + "-" + index} onClick={() => handlePlay(track)} className="flex items-center space-x-4 p-3 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 transition-colors group cursor-pointer">'
);

code = code.replace(
  /<\/div>\s*<\/div>\s*\)\)}\s*<\/div>/g,
  (match, offset, string) => {
    if (string.substring(offset - 200, offset).includes('track.title')) {
       return '</div>\n              </motion.div>\n            ))}\n          </motion.div>';
    }
    return match;
  }
);

fs.writeFileSync('src/components/PlaylistView.tsx', code);
