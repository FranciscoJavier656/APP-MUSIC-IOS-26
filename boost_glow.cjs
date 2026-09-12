const fs = require('fs');
let code = fs.readFileSync('src/components/ExpandedPlayer.tsx', 'utf8');

// The original logic:
// const midImpact = isPlayingRef.current ? (midAvg / 255) : 0;
// if (!(window as any).midSmoothed) (window as any).midSmoothed = 0;
// (window as any).midSmoothed = (window as any).midSmoothed * 0.8 + midImpact * 0.2;
// const glowIntensity = (window as any).midSmoothed;

const oldGlowLogic = `const midImpact = isPlayingRef.current ? (midAvg / 255) : 0;
          
          if (!(window as any).midSmoothed) (window as any).midSmoothed = 0;
          (window as any).midSmoothed = (window as any).midSmoothed * 0.8 + midImpact * 0.2;
          
          const glowIntensity = (window as any).midSmoothed;
          
          if (titleRef.current) {
             const titleGlow = Math.min(glowIntensity * 20, 20);
             const titleOpacity = Math.min(glowIntensity * 0.7, 0.7);
             if (glowIntensity > 0.05) {
                 titleRef.current.style.textShadow = \`0 0 \${titleGlow}px rgba(\${baseRgb}, \${titleOpacity})\`;
                 titleRef.current.style.transform = \`scale(\${1 + glowIntensity * 0.02})\`;
             } else {
                 titleRef.current.style.textShadow = '';
                 titleRef.current.style.transform = 'scale(1)';
             }
          }
          
          if (playButtonRef.current) {
             const btnGlow = Math.min(glowIntensity * 30, 30);
             const btnSpread = Math.min(glowIntensity * 10, 10);
             const btnOpacity = Math.min(glowIntensity * 0.8, 0.8);
             if (glowIntensity > 0.05) {
                 playButtonRef.current.style.boxShadow = \`0 10px 15px -3px rgba(0,0,0,0.3), 0 0 \${btnGlow}px \${btnSpread}px rgba(\${baseRgb}, \${btnOpacity})\`;
             } else {
                 playButtonRef.current.style.boxShadow = ''; 
             }
          }`;

const newGlowLogic = `// Boost the impact so it's super visible
          // midAvg is usually around 30-100. Let's multiply it to get a range closer to 0-1
          const midImpact = isPlayingRef.current ? Math.min((midAvg / 255) * 3.5, 1.5) : 0;
          
          if (!(window as any).midSmoothed) (window as any).midSmoothed = 0;
          // Faster attack, slower decay for a more punchy glow
          (window as any).midSmoothed = (window as any).midSmoothed * 0.75 + midImpact * 0.25;
          
          const glowIntensity = (window as any).midSmoothed;
          
          if (titleRef.current) {
             const titleGlow = glowIntensity * 35;
             const titleOpacity = Math.min(glowIntensity, 1);
             if (glowIntensity > 0.02) {
                 // Removed scale to prevent jitter, focused entirely on the massive glow
                 titleRef.current.style.textShadow = \`0 0 \${titleGlow}px rgba(\${baseRgb}, \${titleOpacity})\`;
             } else {
                 titleRef.current.style.textShadow = 'none';
             }
          }
          
          if (playButtonRef.current) {
             const btnGlow = glowIntensity * 60; // Massive glow
             const btnSpread = glowIntensity * 20; // Spread out far
             const btnOpacity = Math.min(glowIntensity * 1.2, 1);
             if (glowIntensity > 0.02) {
                 playButtonRef.current.style.boxShadow = \`0 10px 15px -3px rgba(0,0,0,0.3), 0 0 \${btnGlow}px \${btnSpread}px rgba(\${baseRgb}, \${btnOpacity})\`;
             } else {
                 playButtonRef.current.style.boxShadow = '0 10px 15px -3px rgba(0,0,0,0.3)'; 
             }
          }`;

code = code.replace(oldGlowLogic, newGlowLogic);

// Remove 'overflow-hidden' from the title wrapper to allow the massive text-shadow to bleed out
const titleWrapperOld = `<div className="overflow-hidden pr-4 flex-1">`;
const titleWrapperNew = `<div className="pr-4 flex-1 min-w-0">`;
code = code.replace(titleWrapperOld, titleWrapperNew);

fs.writeFileSync('src/components/ExpandedPlayer.tsx', code);
console.log("Audio Glow Boosted.");
