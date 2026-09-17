const fs = require('fs');
let code = fs.readFileSync('src/components/ExpandedPlayer.tsx', 'utf8');

// 1. Add refs
const refsOld = `  const lyricsContainerRef = useRef<HTMLDivElement>(null);
  const lyricsBgRef = useRef<HTMLDivElement>(null);`;
const refsNew = `  const lyricsContainerRef = useRef<HTMLDivElement>(null);
  const lyricsBgRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const playButtonRef = useRef<HTMLButtonElement>(null);`;
code = code.replace(refsOld, refsNew);

// 2. Add Audio Glow logic
const glowOld = `          if (lyricsBgRef.current) {
             const scale = 1.1 + ((window as any).bgSmoothed * 0.05); // Subtle scale bounce
             const opacity = 0.4 + ((window as any).bgSmoothed * 0.4); // Brighten on beat
             lyricsBgRef.current.style.transform = \`scale(\${scale})\`;
             lyricsBgRef.current.style.opacity = \`\${opacity}\`;
          }
        }
        
        animationId = requestAnimationFrame(draw);`;

const glowNew = `          if (lyricsBgRef.current) {
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
          const midImpact = isPlayingRef.current ? (midAvg / 255) : 0;
          
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
          }
        }
        
        animationId = requestAnimationFrame(draw);`;
code = code.replace(glowOld, glowNew);

// 3. Attach refs to elements
const titleOld = `<h2 className="text-2xl sm:text-3xl font-bold text-black dark:text-white truncate tracking-tight">{currentTrack.title}</h2>`;
const titleNew = `<h2 ref={titleRef} className="text-2xl sm:text-3xl font-bold text-black dark:text-white truncate tracking-tight transition-transform duration-75">{currentTrack.title}</h2>`;
code = code.replace(titleOld, titleNew);

const playBtnOld = `<motion.button 
            whileTap={{ scale: 0.85 }}
            onClick={() => { Haptics.impact({ style: ImpactStyle.Medium }); togglePlay(); }}
            className="w-20 h-20 flex items-center justify-center text-white rounded-full shadow-lg"`;
const playBtnNew = `<motion.button 
            ref={playButtonRef}
            whileTap={{ scale: 0.85 }}
            onClick={() => { Haptics.impact({ style: ImpactStyle.Medium }); togglePlay(); }}
            className="w-20 h-20 flex items-center justify-center text-white rounded-full shadow-lg"`;
code = code.replace(playBtnOld, playBtnNew);

fs.writeFileSync('src/components/ExpandedPlayer.tsx', code);
console.log("Audio Glow implemented.");
