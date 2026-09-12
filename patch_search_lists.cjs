const fs = require('fs');

let code = fs.readFileSync('src/components/SearchTab.tsx', 'utf8');

if (!code.includes('containerVariants')) {
  code = code.replace(
    "export default function SearchTab() {",
    "export default function SearchTab() {\n  const containerVariants = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.08 } } };\n  const itemVariants = { hidden: { opacity: 0, y: 15 }, show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 400, damping: 30 } } };\n"
  );
}

// 1. Albums list
code = code.replace(
  /<div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-6">\s*\{results\.albums\.items/,
  '<motion.div variants={containerVariants} initial="hidden" animate="show" className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-6">\n                    {results.albums.items'
);
code = code.replace(
  /<div key=\{album\.id\} (.*?) className="flex flex-col gap-2 group cursor-pointer">/g,
  '<motion.div variants={itemVariants} key={album.id} $1 className="flex flex-col gap-2 group cursor-pointer">'
);
code = code.replace(
  /<\/div>\s*<\/div>\s*\)\)}\s*<\/div>/g,
  (match, offset, string) => {
    // Only target the one closing the albums grid
    if (string.substring(offset - 200, offset).includes('album.title')) {
       return '</div>\n                      </motion.div>\n                    ))}\n                  </motion.div>';
    }
    return match;
  }
);

// 2. Artists list
code = code.replace(
  /<div className="flex gap-4 overflow-x-auto no-scrollbar pb-4">\s*\{results\.artists\.items/,
  '<motion.div variants={containerVariants} initial="hidden" animate="show" className="flex gap-4 overflow-x-auto no-scrollbar pb-4">\n                    {results.artists.items'
);
code = code.replace(
  /<div \s*key=\{artist\.id\} \s*onClick(.*?) \s*className="flex-none w-\[100px\] flex flex-col items-center gap-2 cursor-pointer group"\s*>/g,
  '<motion.div variants={itemVariants} key={artist.id} onClick$1 className="flex-none w-[100px] flex flex-col items-center gap-2 cursor-pointer group">'
);
code = code.replace(
  /<\/div>\s*\)\)}\s*<\/div>/g,
  (match, offset, string) => {
    // Check if it's the artists grid closing
    if (string.substring(offset - 200, offset).includes('artist.name')) {
       return '</motion.div>\n                    ))}\n                  </motion.div>';
    }
    return match;
  }
);

// 3. Tracks list
code = code.replace(
  /<div className="space-y-1 border-t border-black\/5 dark:border-white\/5 pt-2">\s*\{results\.tracks\.items/,
  '<motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-1 border-t border-black/5 dark:border-white/5 pt-2">\n                    {results.tracks.items'
);
code = code.replace(
  /<div key=\{track\.id\} onClick(.*?) className="flex items-center space-x-3 p-2 rounded-xl hover:bg-black\/5 dark:hover:bg-white\/5 transition-colors cursor-pointer group">/g,
  '<motion.div variants={itemVariants} key={track.id} onClick$1 className="flex items-center space-x-3 p-2 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer group">'
);
code = code.replace(
  /<\/div>\s*<\/div>\s*\)\)}\s*<\/div>/g,
  (match, offset, string) => {
    // Only target the one closing the tracks grid
    if (string.substring(offset - 200, offset).includes('track.title')) {
       return '</div>\n                      </motion.div>\n                    ))}\n                  </motion.div>';
    }
    return match;
  }
);


// 4. Playlists list
code = code.replace(
  /<div className="flex gap-4 overflow-x-auto no-scrollbar pb-4">\s*\{results\.playlists\.items/,
  '<motion.div variants={containerVariants} initial="hidden" animate="show" className="flex gap-4 overflow-x-auto no-scrollbar pb-4">\n                    {results.playlists.items'
);
code = code.replace(
  /<div \s*key=\{playlist\.id\} \s*onClick(.*?) \s*className="flex-none w-\[140px\] flex flex-col gap-2 cursor-pointer group"\s*>/g,
  '<motion.div variants={itemVariants} key={playlist.id} onClick$1 className="flex-none w-[140px] flex flex-col gap-2 cursor-pointer group">'
);
code = code.replace(
  /<\/div>\s*\)\)}\s*<\/div>/g,
  (match, offset, string) => {
    if (string.substring(offset - 200, offset).includes('playlist.name')) {
       return '</motion.div>\n                    ))}\n                  </motion.div>';
    }
    return match;
  }
);


fs.writeFileSync('src/components/SearchTab.tsx', code);
