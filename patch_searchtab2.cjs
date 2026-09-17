const fs = require('fs');
let code = fs.readFileSync('src/components/SearchTab.tsx', 'utf8');

code = code.replace(
  "                    ))}\n                  </div>\n                </section>",
  "                    ))}\n                  </div>\n                  {filterMode === 'tracks' && hasMore && (\n                    <div ref={targetRef} className=\"py-6 flex justify-center\">\n                      <Loader2 className=\"w-6 h-6 animate-spin text-gray-400\" />\n                    </div>\n                  )}\n                </section>"
);

fs.writeFileSync('src/components/SearchTab.tsx', code);
