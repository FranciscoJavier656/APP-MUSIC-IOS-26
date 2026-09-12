const fs = require('fs');
let code = fs.readFileSync('src/components/ExpandedPlayer.tsx', 'utf8');

const targetRegex = /bgGlowRef\.current\.style\.filter = 'none';/g;
if (targetRegex.test(code)) {
    code = code.replace(targetRegex, "bgGlowRef.current.style.filter = 'saturate(1.8)';");
    fs.writeFileSync('src/components/ExpandedPlayer.tsx', code);
    console.log("Saturation updated in draw loop!");
} else {
    console.log("Could not find the target string.");
}
