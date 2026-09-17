const fs = require('fs');
let dl = fs.readFileSync('src/components/DownloadsTab.tsx', 'utf8');
dl = dl.replace(/streamUrl: Capacitor\.isNativePlatform\(\) \? Capacitor\.convertFileSrc\(item\.track\.localPath\) : item\.track\.localPath/g, "localPath: item.track.localPath");
fs.writeFileSync('src/components/DownloadsTab.tsx', dl);

let lib = fs.readFileSync('src/components/LibraryTab.tsx', 'utf8');
lib = lib.replace(/streamUrl: Capacitor\.isNativePlatform\(\) \? Capacitor\.convertFileSrc\(item\.original\.localPath\) : item\.original\.localPath/g, "localPath: item.original.localPath || item.localPath");
fs.writeFileSync('src/components/LibraryTab.tsx', lib);
console.log("Patched streamUrl usages");
