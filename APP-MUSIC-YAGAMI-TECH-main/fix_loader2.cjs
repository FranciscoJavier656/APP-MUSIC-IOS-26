const fs = require('fs');
let code = fs.readFileSync('src/components/SearchTab.tsx', 'utf8');

code = code.replace(
  /\s*<\/motion\.div>/,
  `\n              {hasMore && (
                <div ref={targetRef} className="py-6 flex justify-center">
                  <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                </div>
              )}
            </motion.div>`
);

fs.writeFileSync('src/components/SearchTab.tsx', code);
