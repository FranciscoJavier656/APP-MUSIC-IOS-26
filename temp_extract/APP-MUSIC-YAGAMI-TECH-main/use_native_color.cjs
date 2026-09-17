const fs = require('fs');
let code = fs.readFileSync('src/components/ExpandedPlayer.tsx', 'utf8');

// 1. Add registerPlugin
if (!code.includes('import { Capacitor, registerPlugin }')) {
    code = code.replace("import { Capacitor }", "import { Capacitor, registerPlugin }");
}

if (!code.includes('const YagamiNative')) {
    code = code.replace("const ExpandedPlayer = ({", "const YagamiNative = registerPlugin<any>('YagamiDownloadManager');\n\nconst ExpandedPlayer = ({");
}

const targetEffect = `
  useEffect(() => {
    if (resolvedImageSrc) {`;
    
const replacementEffect = `
  useEffect(() => {
    if (resolvedImageSrc) {
      if (Capacitor.getPlatform() === 'ios') {
          YagamiNative.getVibrantColor({ url: resolvedImageSrc }).then((res: any) => {
              if (res && res.color) {
                  setDominantColor(res.color);
              }
          }).catch((err: any) => {
              console.error("Native color extraction failed, falling back to web:", err);
              extractWebColor();
          });
          return; // Skip web extraction
      }
      extractWebColor();
      
      function extractWebColor() {`;

const endOfExtract = `
        }
      };
      img.onerror = () => setDominantColor(null);`;
      
const replacementEndOfExtract = `
        }
      };
      img.onerror = () => setDominantColor(null);
      } // end function`;

if (code.includes(targetEffect)) {
    code = code.replace(targetEffect, replacementEffect);
    code = code.replace(endOfExtract, replacementEndOfExtract);
    fs.writeFileSync('src/components/ExpandedPlayer.tsx', code);
    console.log("Updated useEffect to use native Yagami color extraction!");
} else {
    console.log("Could not find the target effect.");
}
