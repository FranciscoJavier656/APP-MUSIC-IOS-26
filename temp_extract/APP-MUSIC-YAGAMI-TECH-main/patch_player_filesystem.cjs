const fs = require('fs');
let code = fs.readFileSync('src/components/PlayerContext.tsx', 'utf8');

code = code.replace(
    /import \{ Capacitor \} from "@capacitor\/core";/,
    "import { Capacitor } from \"@capacitor/core\";\nimport { Filesystem, Directory } from \"@capacitor/filesystem\";"
);

code = code.replace(
    /const stat = await import\('@capacitor\/filesystem'\)\.then\(m => m\.Filesystem\.getUri\(\{/,
    "const stat = await Filesystem.getUri({"
);
code = code.replace(/directory: m\.Directory\.Data,/, "directory: Directory.Data,");

fs.writeFileSync('src/components/PlayerContext.tsx', code);
console.log("Patched PlayerContext.tsx");
