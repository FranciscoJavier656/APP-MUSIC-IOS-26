const fs = require('fs');
let code = fs.readFileSync('src/components/DownloadModal.tsx', 'utf8');
code = code.replace("if (Capacitor.isNativePlatform()) {\n            addDownload(track.id.toString(), track);\n          }", "addDownload(track.id.toString(), track);");
fs.writeFileSync('src/components/DownloadModal.tsx', code);
console.log('done');
