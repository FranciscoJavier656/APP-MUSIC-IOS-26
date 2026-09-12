const fs = require('fs');
let code = fs.readFileSync('src/components/OfflineDetailView.tsx', 'utf8');
code = code.replace(/maximum_bit_depth = 16/g, "maximum_bit_depth > 16");
fs.writeFileSync('src/components/OfflineDetailView.tsx', code);
