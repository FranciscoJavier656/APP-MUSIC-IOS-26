const fs = require('fs');
let code = fs.readFileSync('src/components/ExpandedPlayer.tsx', 'utf8');

const target = `          if (lyricsBgRef.current) {
             const scale = 1.1 + ((window as any).bgSmoothed * 0.05); // Subtle scale bounce
             const opacity = 0.4 + ((window as any).bgSmoothed * 0.4); // Brighten on beat
             lyricsBgRef.current.style.transform = \`scale(\${scale})\`;
             lyricsBgRef.current.style.opacity = \`\${opacity}\`;
          }
        }
        

        animationId = requestAnimationFrame(draw);`;

const replacement = `          if (lyricsBgRef.current) {
             const scale = 1.1 + ((window as any).bgSmoothed * 0.05); // Subtle scale bounce
             const opacity = 0.4 + ((window as any).bgSmoothed * 0.4); // Brighten on beat
             lyricsBgRef.current.style.transform = \`scale(\${scale})\`;
             lyricsBgRef.current.style.opacity = \`\${opacity}\`;
          }
          
          // 2.6 Audio Glow (Tipografía y Controles Radiactivos)
          let midSum = 0;
          const midStart = Math.floor(bufferLength * 0.1);
          const midEnd = Math.floor(bufferLength * 0.4);
          const midCount = Math.max(1, midEnd - midStart);
          for (let i = midStart; i < midEnd; i++) {
             midSum += rawDataArray[i] || 0;
          }
          const midAvg = midSum / midCount;
          const midImpact = isPlayingRef.current ? Math.min((midAvg / 255) * 3.5, 1.5) : 0;
          
          if (!(window as any).midSmoothed) (window as any).midSmoothed = 0;
          (window as any).midSmoothed = (window as any).midSmoothed * 0.75 + midImpact * 0.25;
          
          const glowIntensity = (window as any).midSmoothed;
          
          if (titleRef.current) {
             const titleGlow = glowIntensity * 35;
             const titleOpacity = Math.min(glowIntensity, 1);
             if (glowIntensity > 0.02) {
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
          }
        }

        animationId = requestAnimationFrame(draw);`;

if (code.includes(target)) {
    code = code.replace(target, replacement);
    console.log("Success replacing draw loop!");
} else {
    console.log("Failed to find target string in draw loop.");
}

// Ensure refs are present
if (!code.includes('const titleRef = useRef')) {
    code = code.replace(
        `const lyricsBgRef = useRef<HTMLDivElement>(null);`,
        `const lyricsBgRef = useRef<HTMLDivElement>(null);\n  const titleRef = useRef<HTMLHeadingElement>(null);\n  const playButtonRef = useRef<HTMLButtonElement>(null);`
    );
    console.log("Added refs.");
}

// Ensure refs are attached to the actual elements
if (!code.includes('ref={titleRef}')) {
    code = code.replace(
        `<h2 className="text-2xl sm:text-3xl font-bold text-black dark:text-white truncate tracking-tight">{currentTrack.title}</h2>`,
        `<h2 ref={titleRef} className="text-2xl sm:text-3xl font-bold text-black dark:text-white truncate tracking-tight transition-transform duration-75">{currentTrack.title}</h2>`
    );
    console.log("Attached titleRef.");
}

if (!code.includes('ref={playButtonRef}')) {
    code = code.replace(
        `<motion.button \n            whileTap={{ scale: 0.85 }}`,
        `<motion.button \n            ref={playButtonRef}\n            whileTap={{ scale: 0.85 }}`
    );
    console.log("Attached playButtonRef.");
}

// ensure overflow-hidden is removed
if (code.includes('<div className="overflow-hidden pr-4 flex-1">')) {
    code = code.replace('<div className="overflow-hidden pr-4 flex-1">', '<div className="pr-4 flex-1 min-w-0">');
    console.log("Removed overflow-hidden.");
}

fs.writeFileSync('src/components/ExpandedPlayer.tsx', code);
