const fs = require('fs');
let code = fs.readFileSync('src/components/ExpandedPlayer.tsx', 'utf8');

// The replacement logic:
const newGlowLogic = `if (titleRef.current) titleRef.current.style.textShadow = 'none';
          if (playButtonRef.current) playButtonRef.current.style.boxShadow = '0 10px 15px -3px rgba(0,0,0,0.3)';
          
          if (bgGlowRef.current) {
             const baseOpacity = isDarkMode ? 0.3 : 0.2;
             const addedOpacity = Math.min(glowIntensity * 0.5, 0.5);
             bgGlowRef.current.style.opacity = (baseOpacity + addedOpacity).toString();
             // Very subtle scale heartbeat
             bgGlowRef.current.style.transform = \`scale(\${1 + glowIntensity * 0.05})\`;
          }`;

// Let's use a regex to replace everything from "if (titleRef.current) {" to the end of playButtonRef.current block
const regex = /if \(titleRef\.current\) \{[\s\S]*?playButtonRef\.current\.style\.boxShadow = '0 10px 15px -3px rgba\(0,0,0,0\.3\)'; \s*\}\s*\}/;

if (regex.test(code)) {
    code = code.replace(regex, newGlowLogic);
    console.log("Successfully replaced glow logic in draw loop!");
} else {
    console.log("Regex didn't match.");
}

// Replace the background element
const bgRegex = /<div\s+className="absolute inset-0 opacity-20 dark:opacity-30 mix-blend-screen dark:mix-blend-lighten pointer-events-none transition-colors duration-1000"\s+style=\{\{\s+background: \`radial-gradient\(circle at 50% 0%, \$\{dominantColor\} 0%, transparent 70%\)\`\s+\}\}\s*\/>/;

const bgNew = `<div 
          ref={bgGlowRef}
          className="absolute inset-0 mix-blend-screen dark:mix-blend-lighten pointer-events-none origin-top"
          style={{ 
            background: \`radial-gradient(circle at 50% 0%, \${dominantColor} 0%, transparent 80%)\`,
            opacity: 0.3
          }}
        />`;

if (bgRegex.test(code)) {
    code = code.replace(bgRegex, bgNew);
    console.log("Successfully updated background div!");
} else {
    console.log("Background regex didn't match.");
}

fs.writeFileSync('src/components/ExpandedPlayer.tsx', code);
