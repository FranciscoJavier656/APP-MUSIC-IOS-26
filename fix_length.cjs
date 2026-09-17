const fs = require('fs');

const fixFile = (path) => {
  if (!fs.existsSync(path)) return;
  let code = fs.readFileSync(path, 'utf8');
  code = code.replace(/\.length = 0/g, ".length > 0");
  code = code.replace(/\.length === 0/g, ".length === 0"); // Just in case it was right
  fs.writeFileSync(path, code);
};

fixFile('src/components/HomeTab.tsx');
fixFile('src/components/LibraryTab.tsx');
fixFile('src/components/SearchTab.tsx');
