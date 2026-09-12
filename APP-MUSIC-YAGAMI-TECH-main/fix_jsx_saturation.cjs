const fs = require('fs');
let code = fs.readFileSync('src/components/ExpandedPlayer.tsx', 'utf8');

const targetJSX = `background: \`radial-gradient(circle at 50% 0%, \${dominantColor} 0%, transparent 80%)\`,
            opacity: 0.3`;

const replacementJSX = `background: \`radial-gradient(circle at 50% 0%, \${dominantColor} 0%, transparent 80%)\`,
            opacity: 0.3,
            filter: 'saturate(1.8)'`;

if (code.includes(targetJSX)) {
    code = code.replace(targetJSX, replacementJSX);
    fs.writeFileSync('src/components/ExpandedPlayer.tsx', code);
    console.log("Saturation updated in JSX!");
} else {
    console.log("Could not find the target JSX string.");
}
