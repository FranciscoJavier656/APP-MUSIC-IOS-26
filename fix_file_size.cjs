const fs = require('fs');
let code = fs.readFileSync('src/lib/DownloadManager.ts', 'utf8');

const oldTrackWithLocalPath = `      const trackWithLocalPath = {
        ...track,
        localPath: \`Downloads/\${filename}\`,
        localCoverPath: localCoverPath,
        downloadedAt: Date.now()
      };`;

const newTrackWithLocalPath = `      let sizeBytes = 0;
      try {
         const stat = await Filesystem.stat({ directory: Directory.Data, path: \`Downloads/\${filename}\` });
         sizeBytes = stat.size;
      } catch(e) {}

      const trackWithLocalPath = {
        ...track,
        localPath: \`Downloads/\${filename}\`,
        localCoverPath: localCoverPath,
        sizeBytes: sizeBytes,
        downloadedAt: Date.now()
      };`;

if (code.includes(oldTrackWithLocalPath)) {
    code = code.replace(oldTrackWithLocalPath, newTrackWithLocalPath);
    fs.writeFileSync('src/lib/DownloadManager.ts', code);
    console.log("Replaced successfully");
} else {
    console.log("Could not find the block");
}
