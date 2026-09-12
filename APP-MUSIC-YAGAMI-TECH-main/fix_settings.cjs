const fs = require('fs');

const fixFile = (path) => {
  if (!fs.existsSync(path)) return;
  let code = fs.readFileSync(path, 'utf8');
  code = code.replace(/<p = /g, "<p>");
  code = code.replace(/<\/code =/g, "</code>");
  fs.writeFileSync(path, code);
};

fixFile('src/components/SettingsTab.tsx');
