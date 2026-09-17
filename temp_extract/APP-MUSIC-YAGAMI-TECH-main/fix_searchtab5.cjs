const fs = require('fs');
let code = fs.readFileSync('src/components/SearchTab.tsx', 'utf8');

// Remove all injected loaders
code = code.replace(
  /                  \{filterMode === 'tracks' && hasMore && \(\s*<div ref=\{targetRef\} className="py-6 flex justify-center">\s*<Loader2 className="w-6 h-6 animate-spin text-gray-400" \/>\s*<\/div>\s*\)\}\n/g,
  ""
);

fs.writeFileSync('src/components/SearchTab.tsx', code);
