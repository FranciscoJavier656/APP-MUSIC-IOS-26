const fs = require('fs');

const staggerVariants = `
  const containerVariants = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.05 } } };
  const itemVariants = { hidden: { opacity: 0, y: 15 }, show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 400, damping: 30 } } };
`;

let code = fs.readFileSync('src/components/ArtistView.tsx', 'utf8');

if (!code.includes('containerVariants')) {
  code = code.replace(
    /export default function ArtistView\(\{ artistId, onBack \}: \{ artistId: string, onBack: \(\) => void \}\) \{/,
    match => match + staggerVariants
  );
}

if (!code.includes('import { motion }')) {
  code = code.replace("import React,", "import { motion } from 'motion/react';\nimport React,");
}

// 1. Top Canciones list
code = code.replace(
  /<div className="space-y-1">\s*\{topTracks\.map\(\(track: any, idx: number\) => \{/,
  '<motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-1">\n              {topTracks.map((track: any, idx: number) => {'
);
code = code.replace(
  /<div \s*key=\{track\.id\}\s*onClick=\{\(\) => handlePlay\(track\)\}/g,
  '<motion.div variants={itemVariants} \n                    key={track.id}\n                    onClick={() => handlePlay(track)}'
);
code = code.replace(
  /<\/div>\s*\);\s*\}\)\}\s*<\/div>/g,
  '</div>\n                  </motion.div>\n                );\n              })}\n            </motion.div>'
);

// 2. Álbumes list
code = code.replace(
  /<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">\s*\{albums\.map\(\(album: any\) => \(/,
  '<motion.div variants={containerVariants} initial="hidden" animate="show" className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">\n              {albums.map((album: any) => ('
);
code = code.replace(
  /<div \s*key=\{album\.id\}\s*onClick/g,
  '<motion.div variants={itemVariants} \n                  key={album.id}\n                  onClick'
);
// replace closing tag for albums
code = code.replace(
  /<\/div>\s*<\/div>\s*\)\)\}\s*<\/div>/g,
  '</div>\n                </motion.div>\n              ))}\n            </motion.div>'
);

fs.writeFileSync('src/components/ArtistView.tsx', code);
