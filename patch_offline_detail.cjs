const fs = require('fs');
let code = fs.readFileSync('src/components/OfflineDetailView.tsx', 'utf8');

code = code.replace(/streamUrl: orig\.localPath \|\| t\.localPath/g, "localPath: orig.localPath || t.localPath");
fs.writeFileSync('src/components/OfflineDetailView.tsx', code);
console.log("Patched OfflineDetailView.tsx");
