const fs = require('fs');
let code = fs.readFileSync('src/components/AlbumView.tsx', 'utf8');
const badString = '<motion.div variants={itemVariants} key={track.id || idx} onClick className="flex items-center space-x-3 p-3 rounded-2xl hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer group">';
code = code.split(badString).join('');
fs.writeFileSync('src/components/AlbumView.tsx', code);
