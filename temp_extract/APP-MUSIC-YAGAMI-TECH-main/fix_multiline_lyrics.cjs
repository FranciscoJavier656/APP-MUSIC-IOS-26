const fs = require('fs');
let code = fs.readFileSync('src/components/ExpandedPlayer.tsx', 'utf8');

const resetOld = `                    } else {
                        // Reset fill styles for inactive lines
                        child.style.background = 'none';
                        child.style.WebkitBackgroundClip = 'initial';
                        child.style.WebkitTextFillColor = 'initial';
                        child.style.backgroundClip = 'initial';
                        child.style.color = 'rgba(255,255,255,0.7)';`;

const resetNew = `                    } else {
                        // Reset fill styles for inactive lines
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

code = code.replace(resetOld, resetNew);

const activeOld = `                    const highlightColor = dominantColorRef.current || '#ffffff';
                    activeChild.style.setProperty('--fill-pct', \`\${percent}%\`);
                    activeChild.style.background = \`linear-gradient(to right, \${highlightColor} var(--fill-pct), rgba(255,255,255,0.25) var(--fill-pct))\`;
                    activeChild.style.WebkitBackgroundClip = 'text';
                    activeChild.style.WebkitTextFillColor = 'transparent';
                    activeChild.style.backgroundClip = 'text';
                    activeChild.style.color = 'transparent';`;

const activeNew = `                    const highlightColor = dominantColorRef.current || '#ffffff';
                    const spans = activeChild.querySelectorAll('span');
                    if (spans.length > 0) {
                        spans.forEach((span, index) => {
                            let spanPercent = percent;
                            if (spans.length > 1) {
                                // Stagger the fill: 
                                // Primary line gets 0-70% of duration
                                // Secondary/backup line gets 70-100% of duration
                                if (index === 0) {
                                    spanPercent = Math.min(100, (percent / 70) * 100);
                                } else {
                                    spanPercent = Math.max(0, ((percent - 70) / 30) * 100);
                                }
                            }
                            span.style.setProperty('--fill-pct', \`\${spanPercent}%\`);
                            span.style.background = \`linear-gradient(to right, \${highlightColor} var(--fill-pct), rgba(255,255,255,0.25) var(--fill-pct))\`;
                            span.style.WebkitBackgroundClip = 'text';
                            span.style.WebkitTextFillColor = 'transparent';
                            span.style.backgroundClip = 'text';
                            span.style.color = 'transparent';
                        });
                        activeChild.style.background = 'none';
                        activeChild.style.WebkitTextFillColor = 'initial';
                        activeChild.style.color = 'inherit';
                    } else {
                        activeChild.style.setProperty('--fill-pct', \`\${percent}%\`);
                        activeChild.style.background = \`linear-gradient(to right, \${highlightColor} var(--fill-pct), rgba(255,255,255,0.25) var(--fill-pct))\`;
                        activeChild.style.WebkitBackgroundClip = 'text';
                        activeChild.style.WebkitTextFillColor = 'transparent';
                        activeChild.style.backgroundClip = 'text';
                        activeChild.style.color = 'transparent';
                    }`;

code = code.replace(activeOld, activeNew);

fs.writeFileSync('src/components/ExpandedPlayer.tsx', code);
