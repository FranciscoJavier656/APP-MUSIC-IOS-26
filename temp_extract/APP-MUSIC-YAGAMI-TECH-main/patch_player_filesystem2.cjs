const fs = require('fs');
let code = fs.readFileSync('src/components/PlayerContext.tsx', 'utf8');

code = code.replace(
    /\}\)\);/,
    "});"
);

fs.writeFileSync('src/components/PlayerContext.tsx', code);
console.log("Patched PlayerContext.tsx");
