const fs = require('fs');

const staggerVariants = `
  const containerVariants = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.05 } } };
  const itemVariants = { hidden: { opacity: 0, y: 15 }, show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 400, damping: 30 } } };
`;

function processFile(filePath) {
  let code = fs.readFileSync(filePath, 'utf8');
  
  if (!code.includes('containerVariants')) {
    code = code.replace(
      /export default function [a-zA-Z]+\(.*\) \{/,
      match => match + staggerVariants
    );
  }
  
  // ensure motion is imported
  if (!code.includes('import { motion')) {
      code = code.replace("import React,", "import { motion } from 'motion/react';\nimport React,");
  }

  // Find standard track list maps
  // e.g. <div className="space-y-1">
  code = code.replace(
    /<div className="space-y-1">\s*\{.*\.map\(\(track: any, idx: number\) => \(/g,
    match => match.replace('<div className="space-y-1">', '<motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-1">')
  );
  
  // Track item replacements
  code = code.replace(
    /<div key=\{track\.id || idx\} onClick(.*?) className="flex items-center space-x-3 p-3 rounded-2xl hover:bg-black\/5 dark:hover:bg-white\/5 transition-colors cursor-pointer group">/g,
    '<motion.div variants={itemVariants} key={track.id || idx} onClick$1 className="flex items-center space-x-3 p-3 rounded-2xl hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer group">'
  );
  
  // Closing tags for tracks
  code = code.replace(
    /<\/div>\s*<\/div>\s*\)\)}\s*<\/div>/g,
    (match, offset, string) => {
      if (string.substring(offset - 200, offset).includes('track.title')) {
         return '</div>\n              </motion.div>\n            ))}\n          </motion.div>';
      }
      return match;
    }
  );

  fs.writeFileSync(filePath, code);
}

processFile('src/components/AlbumView.tsx');
