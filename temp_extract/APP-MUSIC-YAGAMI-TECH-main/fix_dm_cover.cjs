const fs = require('fs');

let code = fs.readFileSync('src/lib/DownloadManager.ts', 'utf8');
const original = `             const coverRes = await axios.get(coverUrl, { responseType: 'blob' });
             const coverId = \`cover_\${trackId}\`;
             await WebStorage.saveBlob(coverId, coverRes.data);
             localCoverPath = \`webdb://\${coverId}\`;`;

const fixed = `             localCoverPath = coverUrl;`;

code = code.replace(original, fixed);
fs.writeFileSync('src/lib/DownloadManager.ts', code);
console.log('done');
