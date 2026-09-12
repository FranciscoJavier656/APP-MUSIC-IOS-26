const fs = require('fs');
let code = fs.readFileSync('src/components/ExpandedPlayer.tsx', 'utf8');

const target = `const midImpact = isPlayingRef.current ? Math.min((midAvg / 255) * 3.5, 1.5) : 0;
          
          if (!(window as any).midSmoothed) (window as any).midSmoothed = 0;
          (window as any).midSmoothed = (window as any).midSmoothed * 0.75 + midImpact * 0.25;
          
          const glowIntensity = (window as any).midSmoothed;`;

const replacement = `// Prevent "stuck" glow by calculating the audio spike relative to a moving baseline
          if (!(window as any).baselineMid) (window as any).baselineMid = midAvg;
          (window as any).baselineMid = (window as any).baselineMid * 0.95 + midAvg * 0.05; 
          
          const spike = Math.max(0, midAvg - (window as any).baselineMid);
          // A spike of 20 out of 255 is a solid beat, normalize it to 1.5 max
          const midImpact = isPlayingRef.current ? Math.min((spike / 20), 1.5) : 0;
          
          if (!(window as any).midSmoothed) (window as any).midSmoothed = 0;
          
          // Fast attack, slow decay for a "breathing" light effect
          if (midImpact > (window as any).midSmoothed) {
              (window as any).midSmoothed = (window as any).midSmoothed * 0.4 + midImpact * 0.6; // Attack
          } else {
              (window as any).midSmoothed = (window as any).midSmoothed * 0.93 + midImpact * 0.07; // Decay
          }
          
          const glowIntensity = (window as any).midSmoothed;`;

if (code.includes(target)) {
    code = code.replace(target, replacement);
    fs.writeFileSync('src/components/ExpandedPlayer.tsx', code);
    console.log("Success replacing stuck glow logic!");
} else {
    console.log("Failed to find target string in draw loop.");
}
