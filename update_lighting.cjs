const fs = require('fs');
let code = fs.readFileSync('src/components/ExpandedPlayer.tsx', 'utf8');

const oldLogic = `          if (bgGlowRef.current) {
             const baseOpacity = isDarkMode ? 0.3 : 0.2;
             const addedOpacity = Math.min(glowIntensity * 0.5, 0.5);
             bgGlowRef.current.style.opacity = (baseOpacity + addedOpacity).toString();
             // Very subtle scale heartbeat
             bgGlowRef.current.style.transform = \`scale(\${1 + glowIntensity * 0.05})\`;
          }`;

const newLogic = `          if (bgGlowRef.current) {
             const baseOpacity = isDarkMode ? 0.3 : 0.2;
             bgGlowRef.current.style.opacity = baseOpacity.toString();
             
             // "Calentamiento de Color" effect
             // When quiet: matte/muted (brightness 0.7, saturate 0.7)
             // When loud: incandescent (brightness goes up to ~1.6, saturate to ~2.0)
             const brightness = 0.7 + (glowIntensity * 0.6); 
             const saturation = 0.7 + (glowIntensity * 0.9);
             
             bgGlowRef.current.style.filter = \`brightness(\${brightness}) saturate(\${saturation})\`;
             bgGlowRef.current.style.transform = 'none';
          }`;

if (code.includes(oldLogic)) {
    code = code.replace(oldLogic, newLogic);
    fs.writeFileSync('src/components/ExpandedPlayer.tsx', code);
    console.log("Successfully replaced lighting logic!");
} else {
    console.log("Failed to find exact logic string. Attempting regex...");
    const regex = /if \(bgGlowRef\.current\) \{[\s\S]*?bgGlowRef\.current\.style\.transform = [^\n]*;\s*\}/;
    if (regex.test(code)) {
        code = code.replace(regex, newLogic);
        fs.writeFileSync('src/components/ExpandedPlayer.tsx', code);
        console.log("Successfully replaced lighting logic via regex!");
    } else {
        console.log("Regex failed too.");
    }
}
