const fs = require('fs');
let code = fs.readFileSync('src/components/ExpandedPlayer.tsx', 'utf8');

const newQueueAura = `
          {dominantColor && (
            <motion.div 
              className="absolute -inset-[20%] opacity-[0.08] dark:opacity-[0.15] mix-blend-screen dark:mix-blend-lighten pointer-events-none transition-colors duration-1000"
              style={{ background: \`radial-gradient(circle at 80% 20%, \${dominantColor} 0%, transparent 60%)\` }}
              animate={{
                scale: [1, 1.1, 0.95, 1],
                x: ['0%', '-5%', '2%', '0%'],
                y: ['0%', '5%', '-2%', '0%'],
              }}
              transition={{
                duration: 15,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
          )}
`;

code = code.replace(/\{dominantColor && \(\s*<div\s*className="absolute inset-0 opacity-\[0\.08\] dark:opacity-\[0\.15\] mix-blend-screen dark:mix-blend-lighten pointer-events-none"\s*style=\{\{\s*background: `radial-gradient\(circle at 100% 0%, \$\{dominantColor\} 0%, transparent 60%\)`\s*\}\}\s*\/>\s*\)\}/, newQueueAura.trim());

fs.writeFileSync('src/components/ExpandedPlayer.tsx', code);
