const fs = require('fs');
let code = fs.readFileSync('src/components/ExpandedPlayer.tsx', 'utf8');

// 1. Add bgGlowRef
if (!code.includes('const bgGlowRef = useRef')) {
    code = code.replace(
        `const titleRef = useRef<HTMLHeadingElement>(null);`,
        `const titleRef = useRef<HTMLHeadingElement>(null);\n  const bgGlowRef = useRef<HTMLDivElement>(null);`
    );
}

// 2. Modify the background div to have ref={bgGlowRef} and remove the transition for instant reactivity
const bgOld = `<div \n          className="absolute inset-0 opacity-20 dark:opacity-30 mix-blend-screen dark:mix-blend-lighten pointer-events-none transition-colors duration-1000"\n          style={{ \n            background: \`radial-gradient(circle at 50% 0%, \${dominantColor} 0%, transparent 70%)\` \n          }}\n        />`;
const bgNew = `<div \n          ref={bgGlowRef}\n          className="absolute inset-0 mix-blend-screen dark:mix-blend-lighten pointer-events-none origin-top"\n          style={{ \n            background: \`radial-gradient(circle at 50% -20%, \${dominantColor} 0%, transparent 80%)\`, \n            opacity: 0.3 \n          }}\n        />`;

if (code.includes(bgOld)) {
    code = code.replace(bgOld, bgNew);
} else {
    // try a more loose regex or just look for the class name
    const bgRegex = /<div\s+className="absolute inset-0 opacity-20 dark:opacity-30 mix-blend-screen dark:mix-blend-lighten pointer-events-none[^>]+>\s*<\/div>/;
    // let's do manual replace
}

// 3. Update the draw loop glow logic
const oldGlowLogicTarget = `if (titleRef.current) {
             const titleGlow = glowIntensity * 35;
             const titleOpacity = Math.min(glowIntensity, 1);
             if (glowIntensity > 0.02) {
                 titleRef.current.style.textShadow = \\\`0 0 \\\${titleGlow}px rgba(\\\${baseRgb}, \\\${titleOpacity})\\\`;
             } else {
                 titleRef.current.style.textShadow = 'none';
             }
          }
          
          if (playButtonRef.current) {
             const btnGlow = glowIntensity * 60; // Massive glow
             const btnSpread = glowIntensity * 20; // Spread out far
             const btnOpacity = Math.min(glowIntensity * 1.2, 1);
             if (glowIntensity > 0.02) {
                 playButtonRef.current.style.boxShadow = \\\`0 10px 15px -3px rgba(0,0,0,0.3), 0 0 \\\${btnGlow}px \\\${btnSpread}px rgba(\\\${baseRgb}, \\\${btnOpacity})\\\`;
             } else {
                 playButtonRef.current.style.boxShadow = '0 10px 15px -3px rgba(0,0,0,0.3)'; 
             }
          }`;

// The script will use string replacement. To avoid escaping issues, I'll use regex or plain text split
