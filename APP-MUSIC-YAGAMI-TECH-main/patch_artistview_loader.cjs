const fs = require('fs');
let code = fs.readFileSync('src/components/ArtistView.tsx', 'utf8');

code = code.replace(
  "              })}\n            </div>\n          </div>\n        )}",
  "              })}\n            </div>\n            {hasMoreTracks && (\n              <div ref={targetRef} className=\"py-6 flex justify-center\">\n                <Loader2 className=\"w-6 h-6 animate-spin text-gray-400\" />\n              </div>\n            )}\n          </div>\n        )}"
);

fs.writeFileSync('src/components/ArtistView.tsx', code);
