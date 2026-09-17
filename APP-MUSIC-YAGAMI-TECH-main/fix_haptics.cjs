const fs = require('fs');
let code = fs.readFileSync('src/components/ExpandedPlayer.tsx', 'utf8');
code = code.replace("Haptics.impact({ style }).catch(() => {});", "Haptics.impact({ style: style }).catch(() => {});");
fs.writeFileSync('src/components/ExpandedPlayer.tsx', code);
