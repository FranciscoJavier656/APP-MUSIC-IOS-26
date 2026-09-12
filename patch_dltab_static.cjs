const fs = require('fs');
let code = fs.readFileSync('src/components/DownloadsTab.tsx', 'utf8');

// Add static import
if (!code.includes("import { Filesystem, Directory } from '@capacitor/filesystem'")) {
    code = code.replace(
        /import \{ Capacitor \} from '@capacitor\/core';/,
        "import { Capacitor } from '@capacitor/core';\nimport { Filesystem, Directory } from '@capacitor/filesystem';"
    );
}

// Remove dynamic import
code = code.replace(
    /const m = await import\('@capacitor\/filesystem'\);\n\s*const \{ Filesystem, Directory \} = m;/g,
    "// static import used"
);

fs.writeFileSync('src/components/DownloadsTab.tsx', code);
console.log("Patched DownloadsTab.tsx static import");
