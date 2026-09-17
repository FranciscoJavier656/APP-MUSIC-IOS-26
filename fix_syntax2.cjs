const fs = require('fs');
let code = fs.readFileSync('src/components/ExpandedPlayer.tsx', 'utf8');

const bad = `      };
      img.onload = extractWebColor;`;

const good = `      } // end extractWebColor
      img.onload = extractWebColor;`;

code = code.replace(bad, good);
fs.writeFileSync('src/components/ExpandedPlayer.tsx', code);
console.log("Syntax fixed part 2!");
