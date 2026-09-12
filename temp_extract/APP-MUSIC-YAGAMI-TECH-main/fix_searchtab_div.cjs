const fs = require('fs');
let code = fs.readFileSync('src/components/SearchTab.tsx', 'utf8');

code = code.replace(
  /                      <\/div>\n                    \}\)\}\n                  <\/div>\n                <\/section>\n              \)\}/,
  '                      </motion.div>\n                    ))}\n                  </motion.div>\n                </section>\n              )}'
);

fs.writeFileSync('src/components/SearchTab.tsx', code);
