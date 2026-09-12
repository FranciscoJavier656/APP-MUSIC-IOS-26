const fs = require('fs');
let code = fs.readFileSync('src/components/ExpandedPlayer.tsx', 'utf8');

const target = `// "Calentamiento de Color" effect
             // When quiet: matte/muted (brightness 0.7, saturate 0.7)
             // When loud: incandescent (brightness goes up to ~1.6, saturate to ~2.0)
             const brightness = 0.7 + (glowIntensity * 0.6); 
             const saturation = 0.7 + (glowIntensity * 0.9);
             
             bgGlowRef.current.style.filter = \`brightness(\${brightness}) saturate(\${saturation})\`;
             bgGlowRef.current.style.transform = 'none';`;

const replacement = `// "Cinematic Ambilight" effect (Aura Física)
             // Use macro-energy for a slow, elegant breathing effect instead of fast spikes
             if (!(window as any).macroEnergy) (window as any).macroEnergy = 0;
             if (midImpact > (window as any).macroEnergy) {
                 (window as any).macroEnergy = (window as any).macroEnergy * 0.90 + midImpact * 0.10; // Soft attack
             } else {
                 (window as any).macroEnergy = (window as any).macroEnergy * 0.98 + midImpact * 0.02; // Very slow decay
             }
             
             const energy = (window as any).macroEnergy;
             
             // Expand physically (scale) and gracefully increase opacity
             const dynamicOpacity = Math.min(energy * 0.5, 0.6); 
             const dynamicScale = Math.min(energy * 0.4, 0.4); 
             
             bgGlowRef.current.style.opacity = (baseOpacity + dynamicOpacity).toString();
             bgGlowRef.current.style.transform = \`scale(\${1 + dynamicScale})\`;
             bgGlowRef.current.style.filter = 'none'; // Remove expensive filters`;

if (code.includes(target)) {
    code = code.replace(target, replacement);
    fs.writeFileSync('src/components/ExpandedPlayer.tsx', code);
    console.log("Success replacing cinematic ambilight!");
} else {
    console.log("Could not find the target string.");
}
