const fs = require('fs');
let code = fs.readFileSync('src/components/SearchTab.tsx', 'utf8');

code = code.replace(
  "    if (isIntersecting && hasMore && !loading && !loadingMore) {\n      const nextOffset = offset + 50;\n      setOffset(nextOffset);\n      executeSearch(query, nextOffset);\n    }",
  "    if (isIntersecting && hasMore && !loading && !loadingMore) {\n      executeSearch(query, offset);\n    }"
);

fs.writeFileSync('src/components/SearchTab.tsx', code);
