const fs = require('fs');
let code = fs.readFileSync('src/components/DownloadsTab.tsx', 'utf8');

const oldCompleted = `<span className="text-[11px] text-[#1DB954] font-medium uppercase tracking-wider">Completado</span>`;
const newCompleted = `<span className="text-[11px] text-[#1DB954] font-medium uppercase tracking-wider">Completado {item.track?.sizeBytes ? \`• \${formatBytes(item.track.sizeBytes)}\` : ''}</span>`;

if (code.includes(oldCompleted)) {
  code = code.replace(oldCompleted, newCompleted);
  fs.writeFileSync('src/components/DownloadsTab.tsx', code);
  console.log("Success");
} else {
  console.log("Failed to find block");
}
