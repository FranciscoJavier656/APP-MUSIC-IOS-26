const fs = require('fs');
let code = fs.readFileSync('src/components/ExpandedPlayer.tsx', 'utf8');
if (!code.includes("const YagamiNative")) {
  code = code.replace(
    "import { Capacitor, registerPlugin } from '@capacitor/core';",
    "import { Capacitor, registerPlugin } from '@capacitor/core';\nconst YagamiNative = registerPlugin('YagamiDownloadManager');"
  );
  fs.writeFileSync('src/components/ExpandedPlayer.tsx', code);
  console.log("Fixed YagamiNative reference!");
}
