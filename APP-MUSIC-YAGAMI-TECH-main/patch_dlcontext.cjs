const fs = require('fs');
let code = fs.readFileSync('src/lib/DownloadContext.tsx', 'utf8');

// 1. Add bytes and total to ActiveDownload interface
code = code.replace(
    /progress: number;/,
    "progress: number;\n  bytes?: number;\n  total?: number;"
);

// 2. Pass bytes and total in handleProgress
code = code.replace(
    /progress: e\.detail\.progress/,
    "progress: e.detail.progress, bytes: e.detail.bytes, total: e.detail.total"
);

fs.writeFileSync('src/lib/DownloadContext.tsx', code);
console.log("Patched DownloadContext.tsx");
