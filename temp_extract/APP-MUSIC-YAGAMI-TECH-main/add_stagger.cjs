const fs = require('fs');

const staggerVariants = `
const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08
    }
  }
};
const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 400, damping: 30 } }
};
`;

function injectStagger(filePath) {
  let code = fs.readFileSync(filePath, 'utf8');
  
  if (!code.includes('containerVariants')) {
    code = code.replace(
      /export default function [a-zA-Z]+\(.*\) \{/,
      match => match + staggerVariants
    );
  }

  // Find grids/lists and add motion
  if (filePath.includes('SearchTab.tsx')) {
    // Albums
    code = code.replace(
      /<div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-6">/,
      '<motion.div variants={containerVariants} initial="hidden" animate="show" className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-6">'
    );
    code = code.replace(
      /<div key=\{album\.id\} onClick=\{.*\} className="flex flex-col gap-2 group cursor-pointer">/g,
      match => match.replace('<div ', '<motion.div variants={itemVariants} ')
    );
    // closing tags for albums list
    code = code.replace(
      /<\/img>\n                          \) : \([\s\S]*?\} \/>\n                          \)\}\n                        <\/div>\n                      <\/div>\n                    \)\)\}\n                  <\/div>/g,
      match => match.replace('</div>\n                      </div>', '</div>\n                      </motion.div>').replace('</div', '</motion.div')
    );
    
    // Replace tracks
    code = code.replace(
      /<div className="space-y-1 border-t border-black\/5 dark:border-white\/5 pt-2">/,
      '<motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-1 border-t border-black/5 dark:border-white/5 pt-2">'
    );
    code = code.replace(
      /<div key=\{track\.id\} onClick=\{.*\} className="flex items-center space-x-3 p-2 rounded-xl hover:bg-black\/5 dark:hover:bg-white\/5 transition-colors cursor-pointer group">/g,
      match => match.replace('<div ', '<motion.div variants={itemVariants} ')
    );
    // There are some complex replaces so I will just do it properly via regex.
  }

  fs.writeFileSync(filePath, code);
}
// We will do a regex replacement on SearchTab.tsx
