const fs = require('fs');
let code = fs.readFileSync('src/components/ExpandedPlayer.tsx', 'utf8');

// 1. Add duration to LyricLine
code = code.replace(/type LyricLine = \{ time: number; text: string \};/, 'type LyricLine = { time: number; text: string; duration: number };');

// 2. Parse duration
const parseRegex = /if \(text\) parsed\.push\(\{ time, text \}\);/;
const parseReplacement = `if (text) parsed.push({ time, text, duration: 0 });`;
code = code.replace(parseRegex, parseReplacement);

const parsedLyricsSetRegex = /setParsedLyrics\(parsed\);/;
const parsedLyricsSetReplacement = `
              for (let i = 0; i < parsed.length; i++) {
                if (i < parsed.length - 1) {
                  parsed[i].duration = parsed[i+1].time - parsed[i].time;
                } else {
                  parsed[i].duration = 5; // Default for last line
                }
              }
              setParsedLyrics(parsed);
`;
code = code.replace(parsedLyricsSetRegex, parsedLyricsSetReplacement);

// 3. Add lyricsBgRef
const refsRegex = /const lyricsContainerRef = useRef<HTMLDivElement>\(null\);/;
code = code.replace(refsRegex, `const lyricsContainerRef = useRef<HTMLDivElement>(null);\n  const lyricsBgRef = useRef<HTMLDivElement>(null);`);

// 4. Update lyrics rendering JSX
const lyricsRenderRegex = /<p\s+key=\{idx\}\s+className="text-white\/60 text-\[1\.35rem\] leading-\[1\.4\] font-bold mb-7 transition-all duration-500 ease-\[cubic-bezier\(0\.19,1,0\.22,1\)\] origin-center flex flex-col items-center gap-1\.5"\s+style=\{\{\s*opacity:\s*0\.3,\s*transform:\s*'scale\(0\.95\)',\s*filter:\s*'blur\(4px\)'\s*\}\}\s*>/;
code = code.replace(lyricsRenderRegex, `<p 
                          key={idx} 
                          className="text-white/60 text-[1.35rem] leading-[1.4] font-bold mb-7 transition-all duration-500 ease-[cubic-bezier(0.19,1,0.22,1)] origin-center flex flex-col items-center gap-1.5"
                          style={{ 
                            opacity: 0.3, 
                            transform: 'scale(0.95)', 
                            filter: 'blur(4px)',
                            background: 'none',
                            WebkitBackgroundClip: 'initial',
                            WebkitTextFillColor: 'initial',
                            backgroundClip: 'initial',
                            color: 'rgba(255,255,255,0.7)'
                          }}
                        >`);

// 5. Update RAF loop for Relleno Liquido
const oldLoopRegex = /if \(i === activeIdx\) \{[\s\S]*?\} else \{[\s\S]*?child\.style\.textShadow = 'none';\s*\}/;
const newLoopCode = `if (i === activeIdx) {
                        child.style.opacity = '1';
                        child.style.transform = 'scale(1.15)';
                        child.style.filter = 'blur(0px)';
                        child.style.textShadow = '0 0 20px rgba(255,255,255,0.4)';
                        child.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    } else {
                        // Reset fill styles for inactive lines
                        child.style.background = 'none';
                        child.style.WebkitBackgroundClip = 'initial';
                        child.style.WebkitTextFillColor = 'initial';
                        child.style.backgroundClip = 'initial';
                        child.style.color = 'rgba(255,255,255,0.7)';

                        // Calculate cinematic blur and fade
                        const blurAmount = Math.min(distance * 1.5, 6);
                        const opacityAmount = Math.max(0.6 - (distance * 0.15), 0.1);
                        const scaleAmount = Math.max(0.95 - (distance * 0.02), 0.85);
                        
                        child.style.opacity = opacityAmount.toString();
                        child.style.transform = \`scale(\${scaleAmount})\`;
                        child.style.filter = \`blur(\${blurAmount}px)\`;
                        child.style.textShadow = 'none';
                    }`;
code = code.replace(oldLoopRegex, newLoopCode);

// Inject active line fill logic right after the `if (activeIdx !== activeLyricIndexRef.current)` block
const afterBlockRegex = /}\s*}\s*}\s*}\s*\/\/ 2\. Draw Analyser \(Native iOS vDSP\)/;
const injectFillLogic = `}
                }
            }
            
            // Always update fill on active line
            if (activeIdx >= 0 && activeIdx < lyricsArray.length) {
                const activeLine = lyricsArray[activeIdx];
                const activeChild = lyricsContainerRef.current.children[activeIdx] as HTMLElement;
                if (activeChild) {
                    let percent = ((current - activeLine.time) / activeLine.duration) * 100;
                    if (percent < 0) percent = 0;
                    if (percent > 100) percent = 100;
                    
                    const highlightColor = dominantColorRef.current || '#ffffff';
                    activeChild.style.setProperty('--fill-pct', \`\${percent}%\`);
                    activeChild.style.background = \`linear-gradient(to right, \${highlightColor} var(--fill-pct), rgba(255,255,255,0.25) var(--fill-pct))\`;
                    activeChild.style.WebkitBackgroundClip = 'text';
                    activeChild.style.WebkitTextFillColor = 'transparent';
                    activeChild.style.backgroundClip = 'text';
                    activeChild.style.color = 'transparent';
                }
            }
          }
        }

        // 2. Draw Analyser (Native iOS vDSP)`;
code = code.replace(afterBlockRegex, injectFillLogic);

// 6. Cristal Vivo inside the FFT loop
// Add ref to JSX background
const bgRegex = /className="absolute inset-0 opacity-40 scale-110"\s+style=\{\{ backgroundImage: `url\(\$\{currentTrack\.image\}\)`, backgroundSize: 'cover', backgroundPosition: 'center', filter: 'blur\(30px\)' \}\}/;
const bgReplacement = `ref={lyricsBgRef}
              className="absolute inset-0 opacity-40 scale-110" 
              style={{ backgroundImage: \`url(\${currentTrack.image})\`, backgroundSize: 'cover', backgroundPosition: 'center', filter: 'blur(30px)' }}`;
code = code.replace(bgRegex, bgReplacement);

// Add the logic to the end of the drawing loop
const fftLoopEndRegex = /x \+= barWidth;\s*}\s*}/;
const cristalVivoLogic = `x += barWidth;
          }
          
          // 2.5 Audio Reactive Background (Cristal Vivo)
          let bassSum = 0;
          const bassCount = Math.min(5, bufferLength);
          for(let i=0; i<bassCount; i++) {
             bassSum += rawDataArray[i] || 0;
          }
          const bassAvg = bassCount > 0 ? (bassSum / bassCount) : 0;
          const bassImpact = isPlayingRef.current ? (bassAvg / 255) : 0;
          
          if (!(window as any).bgSmoothed) (window as any).bgSmoothed = 0;
          (window as any).bgSmoothed = (window as any).bgSmoothed * 0.8 + bassImpact * 0.2;
          
          if (lyricsBgRef.current) {
             const scale = 1.1 + ((window as any).bgSmoothed * 0.05); // Subtle scale bounce
             const opacity = 0.4 + ((window as any).bgSmoothed * 0.4); // Brighten on beat
             lyricsBgRef.current.style.transform = \`scale(\${scale})\`;
             lyricsBgRef.current.style.opacity = \`\${opacity}\`;
          }
        }`;
code = code.replace(fftLoopEndRegex, cristalVivoLogic);

fs.writeFileSync('src/components/ExpandedPlayer.tsx', code);
console.log("Premium Lyrics features added.");
