const fs = require('fs');
let code = fs.readFileSync('src/components/DownloadsTab.tsx', 'utf8');

const target = `    // Assuming ~30MB per FLAC track for UI purposes if unknown
    const totalSize = completed.length * (30 * 1024 * 1024);`;

const replacement = `    // Use actual bytes if possible, else just 0
    const totalSize = completed.reduce((acc, item) => acc + (item.progress?.bytes || 0), 0);`;

if (code.includes(target)) {
  fs.writeFileSync('src/components/DownloadsTab.tsx', code.replace(target, replacement));
  console.log("Patched DownloadsTab.tsx");
} else {
  console.log("Target not found in DownloadsTab.tsx");
}
