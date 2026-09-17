const fs = require('fs');

let code = fs.readFileSync('src/lib/DownloadManager.ts', 'utf8');
code = code.replace(/export const WebStorage = \{[\s\S]+?\};\n/, "import { WebStorage } from './WebStorage';\n");

fs.writeFileSync('src/lib/DownloadManager.ts', code);
console.log('done');
