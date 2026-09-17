const fs = require('fs');

const fixFile = (path) => {
  if (!fs.existsSync(path)) return;
  let code = fs.readFileSync(path, 'utf8');
  code = code.replace(/\+>/g, "+=");
  fs.writeFileSync(path, code);
};

fixFile('src/components/PlayerContext.tsx');
fixFile('src/lib/DownloadManager.ts');
