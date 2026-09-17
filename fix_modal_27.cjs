const fs = require('fs');
let code = fs.readFileSync('src/components/DownloadModal.tsx', 'utf8');

code = code.replace("onClick={() => setFormat('6')}", "onClick={() => setFormat('27')}");
code = code.replace("format === '6'", "format === '27'");
code = code.replace("Lossless 16-bit", "Hi-Res 24-bit");

fs.writeFileSync('src/components/DownloadModal.tsx', code);
console.log('done');
