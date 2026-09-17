const fs = require('fs');

let code = fs.readFileSync('src/components/ExpandedPlayer.tsx', 'utf8');

const newLyricsLogic = `
            if (activeIdx !== activeLyricIndexRef.current) {
                activeLyricIndexRef.current = activeIdx;
                const container = lyricsContainerRef.current;
                const children = container.children;
                for (let i = 0; i < children.length; i++) {
                    const child = children[i] as HTMLElement;
                    const distance = Math.abs(i - activeIdx);
                    
                    if (i === activeIdx) {
                        child.style.opacity = '1';
                        child.style.transform = 'scale(1.15)';
                        child.style.color = '#ffffff';
                        child.style.filter = 'blur(0px)';
                        child.style.textShadow = '0 0 20px rgba(255,255,255,0.4)';
                        child.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    } else {
                        // Calculate cinematic blur and fade
                        const blurAmount = Math.min(distance * 1.5, 6);
                        const opacityAmount = Math.max(0.6 - (distance * 0.15), 0.1);
                        const scaleAmount = Math.max(0.95 - (distance * 0.02), 0.85);
                        
                        child.style.opacity = opacityAmount.toString();
                        child.style.transform = \`scale(\${scaleAmount})\`;
                        child.style.color = 'rgba(255,255,255,0.7)';
                        child.style.filter = \`blur(\${blurAmount}px)\`;
                        child.style.textShadow = 'none';
                    }
                }
            }
`;

// Replace the old lyrics logic
code = code.replace(
  /if \(activeIdx !== activeLyricIndexRef\.current\) \{[\s\S]*?child\.style\.color = 'rgba\(255,255,255,0\.7\)';\s*\}\s*\}\s*\}/,
  newLyricsLogic.trim()
);

fs.writeFileSync('src/components/ExpandedPlayer.tsx', code);
