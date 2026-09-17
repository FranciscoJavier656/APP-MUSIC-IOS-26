const fs = require('fs');
let code = fs.readFileSync('src/components/ExpandedPlayer.tsx', 'utf8');

// 1. Replace the JSX rendering
const jsxOld = `{line.text.split('^').map((part, i) => (
                            <span key={i} className={i > 0 ? "text-[0.75em] font-medium opacity-75 mt-0.5" : ""}>{part}</span>
                          ))}`;
const jsxNew = `{line.text.split('^').map((part, i) => (
                            <div key={i} className={i > 0 ? "text-[0.75em] font-medium opacity-75 mt-0.5 text-center" : "text-center"}>
                              {part.split(' ').map((word, w) => (
                                <span key={w} className="word inline-block mr-[0.25em]">{word}</span>
                              ))}
                            </div>
                          ))}`;
code = code.replace(jsxOld, jsxNew);

// 2. Replace the reset logic for inactive lines
const resetOld = `// Reset fill styles for inactive lines
                        child.style.background = 'none';
                        child.style.WebkitBackgroundClip = 'initial';
                        child.style.WebkitTextFillColor = 'initial';
                        child.style.backgroundClip = 'initial';
                        child.style.color = 'rgba(255,255,255,0.7)';
                        
                        const spans = child.querySelectorAll('span');
                        spans.forEach(span => {
                            span.style.background = 'none';
                            span.style.WebkitBackgroundClip = 'initial';
                            span.style.WebkitTextFillColor = 'initial';
                            span.style.backgroundClip = 'initial';
                            span.style.color = 'inherit';
                        });`;

const resetNew = `// Reset fill styles for inactive lines
                        child.style.background = 'none';
                        child.style.WebkitBackgroundClip = 'initial';
                        child.style.WebkitTextFillColor = 'initial';
                        child.style.backgroundClip = 'initial';
                        child.style.color = 'rgba(255,255,255,0.5)';
                        
                        const words = child.querySelectorAll('.word');
                        words.forEach(w => {
                            const htmlWord = w;
                            htmlWord.style.background = 'none';
                            htmlWord.style.WebkitBackgroundClip = 'initial';
                            htmlWord.style.WebkitTextFillColor = 'initial';
                            htmlWord.style.backgroundClip = 'initial';
                            htmlWord.style.color = 'inherit';
                            htmlWord.style.textShadow = 'none';
                        });`;

code = code.replace(resetOld, resetNew);

// 3. Replace the active fill logic
const activeRegex = /\/\/ Always update fill on active line\s*if \(activeIdx >= 0 && activeIdx < lyricsArray\.length\) \{[\s\S]*?\}\s*\}\s*\}/;

const activeNewLogic = `// Always update fill on active line
            if (activeIdx >= 0 && activeIdx < lyricsArray.length) {
                const activeLine = lyricsArray[activeIdx];
                const activeChild = lyricsContainerRef.current.children[activeIdx];
                if (activeChild) {
                    let percent = ((current - activeLine.time) / activeLine.duration);
                    if (percent < 0) percent = 0;
                    if (percent > 1) percent = 1;
                    
                    const words = activeChild.querySelectorAll('.word');
                    if (words.length > 0) {
                        const totalWords = words.length;
                        words.forEach((wordSpan, wIdx) => {
                            const wordStart = wIdx / totalWords;
                            const wordEnd = (wIdx + 1) / totalWords;
                            const htmlWord = wordSpan;
                            
                            if (percent >= wordEnd) {
                                htmlWord.style.background = 'none';
                                htmlWord.style.color = '#ffffff';
                                htmlWord.style.WebkitTextFillColor = 'initial';
                                htmlWord.style.textShadow = '0 0 16px rgba(255,255,255,0.4)';
                            } else if (percent <= wordStart) {
                                htmlWord.style.background = 'none';
                                htmlWord.style.color = 'rgba(255,255,255,0.3)';
                                htmlWord.style.WebkitTextFillColor = 'initial';
                                htmlWord.style.textShadow = 'none';
                            } else {
                                const wordPct = ((percent - wordStart) / (wordEnd - wordStart)) * 100;
                                htmlWord.style.background = \`linear-gradient(to right, #ffffff \${wordPct}%, rgba(255,255,255,0.3) \${wordPct}%)\`;
                                htmlWord.style.WebkitBackgroundClip = 'text';
                                htmlWord.style.WebkitTextFillColor = 'transparent';
                                htmlWord.style.backgroundClip = 'text';
                                htmlWord.style.textShadow = '0 0 16px rgba(255,255,255,0.2)';
                            }
                        });
                    }
                }
            }`;

code = code.replace(activeRegex, activeNewLogic);

fs.writeFileSync('src/components/ExpandedPlayer.tsx', code);
