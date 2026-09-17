const fs = require('fs');
let code = fs.readFileSync('src/lib/DownloadManager.ts', 'utf8');

// 1. Pass bytes and total in progress event
code = code.replace(
    /detail: \{ trackId, progress: percent \}/,
    "detail: { trackId, progress: percent, bytes: progress.bytes, total: progress.contentLength }"
);

// 2. Add progress: true to downloadFile
code = code.replace(
    /directory: Directory\.Data,\n\s*\}\);/,
    "directory: Directory.Data,\n        progress: true\n      });"
);

// 3. Remove fake delays
code = code.replace(/await new Promise\(r => setTimeout\(r, 800\)\);/g, "");
code = code.replace(/await new Promise\(r => setTimeout\(r, 600\)\);/g, "");
code = code.replace(/await new Promise\(r => setTimeout\(r, 500\)\);/g, "");

fs.writeFileSync('src/lib/DownloadManager.ts', code);
console.log("Patched DownloadManager.ts");
