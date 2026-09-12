const fs = require('fs');
let code = fs.readFileSync('src/components/SearchTab.tsx', 'utf8');

code = code.replace(
  /(\s*)\)\)\}\s*<\/div>\s*<\/section>/,
  `$1))\}
                  </div>
                  {filterMode === 'tracks' && hasMore && (
                    <div ref={targetRef} className="py-6 flex justify-center">
                      <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                    </div>
                  )}
                </section>`
);

fs.writeFileSync('src/components/SearchTab.tsx', code);
