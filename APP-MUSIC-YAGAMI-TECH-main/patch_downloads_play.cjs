const fs = require('fs');
let code = fs.readFileSync('src/components/DownloadsTab.tsx', 'utf8');

const targetRegex = /onClick=\{\(\) => \{\n\s*playTrack\(\{\n\s*\.\.\.item\.track,/;
const replacement = `onClick={() => {
                              const t = item.track;
                              playTrack({
                                id: t.id ? t.id.toString() : item.id,
                                title: t.title,
                                artist: t.artist?.name || t.performer?.name || 'Unknown',
                                image: t.album?.image?.large || t.album?.image?.small || t.image?.large || t.image || '',
                                hires: t.hires || t.maximum_bit_depth > 16 || false,
                                duration: t.duration || 0,
                                streamUrl: Capacitor.isNativePlatform() && t.localPath ? Capacitor.convertFileSrc(t.localPath) : t.localPath
                              });`;

if (code.match(targetRegex)) {
  code = code.replace(
    /onClick=\{\(\) => \{\n\s*playTrack\(\{\n\s*\.\.\.item\.track,\n\s*streamUrl: Capacitor\.isNativePlatform\(\) \? Capacitor\.convertFileSrc\(item\.track\.localPath\) : item\.track\.localPath\n\s*\}\);\n\s*\}\}/,
    replacement + "\n                            }}"
  );
  fs.writeFileSync('src/components/DownloadsTab.tsx', code);
  console.log("Patched DownloadsTab.tsx playTrack");
} else {
  console.log("Target not found in DownloadsTab.tsx for playTrack");
}
