const fs = require('fs');
let code = fs.readFileSync('src/components/ExpandedPlayer.tsx', 'utf8');

// 1. Boost base opacity
const opacityOld = `const baseOpacity = isDarkMode ? 0.3 : 0.2;`;
const opacityNew = `const baseOpacity = isDarkMode ? 0.45 : 0.35;`;
code = code.replace(opacityOld, opacityNew);

// 2. Add brightness to draw loop filter
const filterOld = `bgGlowRef.current.style.filter = 'saturate(1.8)';`;
const filterNew = `bgGlowRef.current.style.filter = 'saturate(1.8) brightness(1.25)';`;
code = code.replace(new RegExp(filterOld.replace(/[.*+?^\${}()|[\]\\]/g, '\\$&'), 'g'), filterNew);

// 3. Update JSX
const jsxOld = `background: \`radial-gradient(circle at 50% 0%, \${dominantColor} 0%, transparent 80%)\`,
            opacity: 0.3,
            filter: 'saturate(1.8)'`;
const jsxNew = `background: \`radial-gradient(circle at 50% 0%, \${dominantColor} 0%, transparent 80%)\`,
            opacity: 0.45,
            filter: 'saturate(1.8) brightness(1.25)'`;
code = code.replace(jsxOld, jsxNew);

fs.writeFileSync('src/components/ExpandedPlayer.tsx', code);
console.log('Illumination boosted!');
