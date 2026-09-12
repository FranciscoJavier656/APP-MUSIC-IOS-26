const fs = require('fs');
let code = fs.readFileSync('src/components/ExpandedPlayer.tsx', 'utf8');

const regex = /\{dominantColor && \(\s*<motion\.div\s*className="absolute inset-0 pointer-events-none overflow-hidden[\s\S]*?<\/motion\.div>\s*\)\}/;

const originalAura = `{dominantColor && (
        <div 
          className="absolute inset-0 opacity-20 dark:opacity-30 mix-blend-screen dark:mix-blend-lighten pointer-events-none transition-colors duration-1000"
          style={{ 
            background: \`radial-gradient(circle at 50% 0%, \${dominantColor} 0%, transparent 70%)\` 
          }}
        />
      )}`;

if (regex.test(code)) {
    code = code.replace(regex, originalAura);
    fs.writeFileSync('src/components/ExpandedPlayer.tsx', code);
    console.log("Main aura reverted.");
} else {
    console.log("Main aura not found. (Maybe regex mismatch)");
}
