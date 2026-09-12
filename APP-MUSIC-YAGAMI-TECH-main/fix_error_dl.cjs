const fs = require('fs');
let code = fs.readFileSync('src/components/DownloadsTab.tsx', 'utf8');
code = code.replace(/error: dl\.error\s*error: dl\.error/g, 'error: dl.error');
fs.writeFileSync('src/components/DownloadsTab.tsx', code);
