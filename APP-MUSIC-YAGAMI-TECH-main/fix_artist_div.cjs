const fs = require('fs');
let code = fs.readFileSync('src/components/ArtistView.tsx', 'utf8');

code = code.replace(
  /                  <\/div>\n                  <\/motion.div>\n                \);\n              \}\)\}\n            <\/motion.div>/,
  '                  </motion.div>\n                );\n              })}\n            </motion.div>'
);

fs.writeFileSync('src/components/ArtistView.tsx', code);
