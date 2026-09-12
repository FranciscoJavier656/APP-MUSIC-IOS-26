const fs = require('fs');

const staggerVariants = `
  const containerVariants = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.05 } } };
  const itemVariants = { hidden: { opacity: 0, y: 15 }, show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 400, damping: 30 } } };
`;

let code = fs.readFileSync('src/components/AlbumView.tsx', 'utf8');

if (!code.includes('containerVariants')) {
  code = code.replace(
    /export default function AlbumView\(\{ albumId, onBack \}: \{ albumId: string, onBack: \(\) => void \}\) \{/,
    match => match + staggerVariants
  );
}

if (!code.includes('import { motion }')) {
  code = code.replace("import React,", "import { motion } from 'motion/react';\nimport React,");
}

code = code.replace(
  /<div className="space-y-1">/,
  '<motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-1">'
);

code = code.replace(
  /<div \s*key=\{track\.id\} \s*onClick=\{\(\) => handlePlay\(track\)\} \s*className="flex items-center space-x-4 p-3 rounded-xl hover:bg-black\/5 dark:hover:bg-white\/5 transition-colors group cursor-pointer"\s*>/g,
  '<motion.div variants={itemVariants} key={track.id} onClick={() => handlePlay(track)} className="flex items-center space-x-4 p-3 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 transition-colors group cursor-pointer">'
);

// close tags
code = code.replace(
  /<\/div>\s*<\/div>\s*\)\)}\s*<\/div>/g,
  '</div>\n              </motion.div>\n            ))}\n          </motion.div>'
);

fs.writeFileSync('src/components/AlbumView.tsx', code);
