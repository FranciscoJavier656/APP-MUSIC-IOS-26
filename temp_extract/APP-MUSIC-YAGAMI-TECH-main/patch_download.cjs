const fs = require('fs');
let code = fs.readFileSync('src/lib/DownloadManager.ts', 'utf8');

code = code.replace(
  /const trackWithLocalPath = \{[\s\S]*?downloadedAt: Date\.now\(\)\n\s*\};/,
  `
      let localCoverPath = null;
      try {
        const coverUrlObj = track.album?.image || track.image;
        let coverUrl = coverUrlObj?.large || coverUrlObj?.medium || coverUrlObj?.small || (typeof coverUrlObj === 'string' ? coverUrlObj : null);
        if (coverUrl) {
           if (coverUrl.startsWith('//')) coverUrl = 'https:' + coverUrl;
           const coverFilename = \`\${trackId}_cover.jpg\`;
           await Filesystem.downloadFile({
             url: coverUrl,
             path: \`Downloads/\${coverFilename}\`,
             directory: Directory.Data
           });
           localCoverPath = \`Downloads/\${coverFilename}\`;
        }
      } catch (ce) {
         console.warn("Could not download cover", ce);
      }

      const trackWithLocalPath = {
        ...track,
        localPath: \`Downloads/\${filename}\`,
        localCoverPath: localCoverPath,
        downloadedAt: Date.now()
      };`
);

fs.writeFileSync('src/lib/DownloadManager.ts', code);
