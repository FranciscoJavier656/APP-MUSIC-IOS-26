const fs = require('fs');
let code = fs.readFileSync('src/components/SearchTab.tsx', 'utf8');

code = code.replace(
  "if (isIntersecting && hasMore && !loading && !loadingMore && filterMode === 'tracks' || filterMode === 'all') {",
  "if (isIntersecting && hasMore && !loading && !loadingMore && (filterMode === 'tracks' || filterMode === 'all')) {"
);

fs.writeFileSync('src/components/SearchTab.tsx', code);
