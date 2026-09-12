const fs = require('fs');
let code = fs.readFileSync('src/components/OfflineImage.tsx', 'utf8');
code = code.replace('<img src={src}', '<img src={src || ""}');
fs.writeFileSync('src/components/OfflineImage.tsx', code);
console.log("OfflineImage fixed");
