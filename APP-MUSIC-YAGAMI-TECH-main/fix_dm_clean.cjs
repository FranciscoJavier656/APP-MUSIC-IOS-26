const fs = require('fs');

let code = fs.readFileSync('src/lib/DownloadManager.ts', 'utf8');
code = code.replace(/import \{ WebStorage \} from '.\/WebStorage';[\s\S]*?async removeBlob\(id: string\) \{[\s\S]*?\}\s*?\};\s*?\n/m, "import { WebStorage } from './WebStorage';\n\n");
fs.writeFileSync('src/lib/DownloadManager.ts', code);
console.log('done');
