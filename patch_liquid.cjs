const fs = require('fs');

const path = 'src/components/LiquidTabBar.tsx';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(/\\\`/g, '`').replace(/\\\$/g, '$');

fs.writeFileSync(path, content, 'utf8');
console.log("Fixed backslashes in LiquidTabBar.tsx");
