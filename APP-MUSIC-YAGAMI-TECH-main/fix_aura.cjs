const fs = require('fs');
let code = fs.readFileSync('src/components/ExpandedPlayer.tsx', 'utf8');

const regex = /if \(bgGlowRef\.current\) \{[\s\S]*?bgGlowRef\.current\.style\.filter = 'none';[^\n]*\n\s*\}/;

const replacement = `if (bgGlowRef.current) {
             // 1. Opacidad FIJA Y PRESENTE (no se toca)
             const baseOpacity = isDarkMode ? 0.3 : 0.2;
             bgGlowRef.current.style.opacity = baseOpacity.toString();
             
             // 2. Aura Física (Expansión suave y natural)
             if (!(window as any).auraSize) (window as any).auraSize = 0;
             
             if (midImpact > (window as any).auraSize) {
                 (window as any).auraSize = (window as any).auraSize * 0.85 + midImpact * 0.15; // Smooth attack
             } else {
                 (window as any).auraSize = (window as any).auraSize * 0.95 + midImpact * 0.05; // Smooth decay
             }
             
             const aura = (window as any).auraSize;
             
             // Base scale is 1 (contained halo). It expands up to 1.6x its size when intense.
             const dynamicScale = Math.min(aura * 0.6, 0.6); 
             
             bgGlowRef.current.style.transform = \`scale(\${1 + dynamicScale})\`;
             bgGlowRef.current.style.filter = 'none';
          }`;

if (regex.test(code)) {
    code = code.replace(regex, replacement);
    fs.writeFileSync('src/components/ExpandedPlayer.tsx', code);
    console.log("Success replacing aura effect!");
} else {
    console.log("Could not find the target regex string.");
}
