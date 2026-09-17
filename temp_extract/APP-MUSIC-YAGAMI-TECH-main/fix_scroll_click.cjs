const fs = require('fs');
let code = fs.readFileSync('src/components/ExpandedPlayer.tsx', 'utf8');

code = code.replace(/<div onClick=\{\(e\) => e\.stopPropagation\(\)\}/g, '<div');

fs.writeFileSync('src/components/ExpandedPlayer.tsx', code);
console.log("Removed stopPropagation from scroll container");
