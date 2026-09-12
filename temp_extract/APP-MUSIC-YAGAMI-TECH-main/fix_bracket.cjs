const fs = require('fs');
let code = fs.readFileSync('src/components/ExpandedPlayer.tsx', 'utf8');

const faultyLogic = `          if (lyricsBgRef.current) {
             const scale = 1.1 + ((window as any).bgSmoothed * 0.05); // Subtle scale bounce
             const opacity = 0.4 + ((window as any).bgSmoothed * 0.4); // Brighten on beat
             lyricsBgRef.current.style.transform = \`scale(\${scale})\`;
             lyricsBgRef.current.style.opacity = \`\${opacity}\`;
          }
        }`;

const correctLogic = `          if (lyricsBgRef.current) {
             const scale = 1.1 + ((window as any).bgSmoothed * 0.05); // Subtle scale bounce
             const opacity = 0.4 + ((window as any).bgSmoothed * 0.4); // Brighten on beat
             lyricsBgRef.current.style.transform = \`scale(\${scale})\`;
             lyricsBgRef.current.style.opacity = \`\${opacity}\`;
          }
        }
        `;

code = code.replace(faultyLogic, correctLogic);
fs.writeFileSync('src/components/ExpandedPlayer.tsx', code);
console.log("Bracket fixed.");
