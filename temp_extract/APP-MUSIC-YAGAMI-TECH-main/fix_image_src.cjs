const fs = require('fs');
let code = fs.readFileSync('src/lib/image.ts', 'utf8');
code = code.replace(/return undefined;/g, 'return "";');
code = code.replace(/return url;/g, 'return url || "";');
code = code.replace('export function getImageSrc(imageObj: any): string | undefined {', 'export function getImageSrc(imageObj: any): string {');
fs.writeFileSync('src/lib/image.ts', code);
console.log("image.ts fixed");
