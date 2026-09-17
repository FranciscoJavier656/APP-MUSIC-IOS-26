const fs = require('fs');
let code = fs.readFileSync('src/components/ExpandedPlayer.tsx', 'utf8');

// The block ends around here:
const badEnd = `      };
      img.onerror = () => setDominantColor(null);
      } // end function
    } else {
      setDominantColor(null);
    }`;

const goodEnd = `      };
      img.onload = extractWebColor;
      img.onerror = () => setDominantColor(null);
    } else {
      setDominantColor(null);
    }`;

code = code.replace(badEnd, goodEnd);
fs.writeFileSync('src/components/ExpandedPlayer.tsx', code);
console.log("Syntax fixed!");
