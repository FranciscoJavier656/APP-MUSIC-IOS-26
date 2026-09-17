const fs = require('fs');

let appCode = fs.readFileSync('src/App.tsx', 'utf8');
appCode = appCode.replace('<main className="flex-1 overflow-y-auto pb-[110px] relative">', '<main className="flex-1 relative overflow-hidden">');
appCode = appCode.replace('<main className="flex-1 overflow-y-auto pb-[88px] relative">', '<main className="flex-1 relative overflow-hidden">');
fs.writeFileSync('src/App.tsx', appCode);
console.log("App.tsx main padding removed");
