const fs = require('fs');
let code = fs.readFileSync('src/components/ExpandedPlayer.tsx', 'utf8');

const oldClass = `className="relative aspect-square rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.3)] cursor-pointer"`;
const newClass = `className="relative aspect-square rounded-3xl shadow-[0_35px_60px_-15px_rgba(0,0,0,1),0_20px_30px_-5px_rgba(0,0,0,0.8)] cursor-pointer"`;

if (code.includes(oldClass)) {
    code = code.replace(oldClass, newClass);
    fs.writeFileSync('src/components/ExpandedPlayer.tsx', code);
    console.log("Updated shadow class.");
} else {
    console.log("Could not find the old class string.");
}
