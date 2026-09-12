const fs = require('fs');

let code = fs.readFileSync('src/lib/DownloadContext.tsx', 'utf8');
code = code.replace("if (!Capacitor.isNativePlatform()) return;", "// if (!Capacitor.isNativePlatform()) return;");
fs.writeFileSync('src/lib/DownloadContext.tsx', code);
console.log('done');
