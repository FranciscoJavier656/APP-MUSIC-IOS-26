const fs = require('fs');
let code = fs.readFileSync('src/components/ExpandedPlayer.tsx', 'utf8');

const regexQueue = /\{dominantColor && \(\s*<motion\.div\s*className="absolute -inset-\[20%\] opacity-\[0\.08\] dark:opacity-\[0\.15\] mix-blend-screen dark:mix-blend-lighten pointer-events-none transition-colors duration-1000"[\s\S]*?<\/motion\.div>\s*\)\}/;

const originalQueueAura = `{dominantColor && (
            <div 
              className="absolute inset-0 opacity-[0.08] dark:opacity-[0.15] mix-blend-screen dark:mix-blend-lighten pointer-events-none"
              style={{ background: \`radial-gradient(circle at 100% 0%, \${dominantColor} 0%, transparent 60%)\` }}
            />
          )}`;

if (regexQueue.test(code)) {
    code = code.replace(regexQueue, originalQueueAura);
    fs.writeFileSync('src/components/ExpandedPlayer.tsx', code);
    console.log("Queue aura reverted.");
} else {
    console.log("Queue aura not found. (Maybe regex mismatch)");
}
