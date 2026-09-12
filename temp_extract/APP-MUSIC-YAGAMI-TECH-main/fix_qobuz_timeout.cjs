const fs = require('fs');
let code = fs.readFileSync('src/lib/qobuz.ts', 'utf8');
code = code.replace("axios.defaults.timeout = 15000;", "axios.defaults.timeout = 30000; // Increased base timeout to 30s");
fs.writeFileSync('src/lib/qobuz.ts', code);
console.log('Fixed timeout in qobuz.ts');
