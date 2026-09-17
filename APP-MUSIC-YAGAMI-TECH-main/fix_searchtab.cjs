const fs = require('fs');
let code = fs.readFileSync('src/components/SearchTab.tsx', 'utf8');

code = code.replace(/activeFilter === 'tracks'/g, "filterMode === 'tracks' || filterMode === 'all'");
code = code.replace(/activeFilter/g, "filterMode");

// Wait, the loader was added conditionally on activeFilter === 'tracks'. 
// It's fine to just load more if they are at the bottom of the search results and there are more tracks. 
// Ideally we load more of what they are looking at, but `searchQobuz` returns everything. So we can just fetch more and append everything.

fs.writeFileSync('src/components/SearchTab.tsx', code);
