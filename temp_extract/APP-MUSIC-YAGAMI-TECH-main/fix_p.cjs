const fs = require('fs');

const fixFile = (path) => {
  if (!fs.existsSync(path)) return;
  let code = fs.readFileSync(path, 'utf8');
  code = code.replace(/<p=\{error\}<\/p>/g, "<p>{error}</p>");
  fs.writeFileSync(path, code);
};

fixFile('src/components/SearchTab.tsx');
fixFile('src/components/LibraryTab.tsx');

