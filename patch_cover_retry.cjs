const fs = require('fs');
let code = fs.readFileSync('src/lib/DownloadManager.ts', 'utf8');

const targetCover = `           await Filesystem.downloadFile({
             url: coverUrl,
             path: \`Downloads/\${coverFilename}\`,
             directory: Directory.Data
           });`;

const replaceCover = `           await withRetry(async () => {
             await Filesystem.downloadFile({
               url: coverUrl,
               path: \`Downloads/\${coverFilename}\`,
               directory: Directory.Data
             });
           }, 3, 2000);`;
code = code.replace(targetCover, replaceCover);

fs.writeFileSync('src/lib/DownloadManager.ts', code);
