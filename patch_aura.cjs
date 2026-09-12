const fs = require('fs');
let code = fs.readFileSync('src/components/ExpandedPlayer.tsx', 'utf8');

const oldAura = `
      {dominantColor && (
        <div 
          className="absolute inset-0 opacity-20 dark:opacity-30 mix-blend-screen dark:mix-blend-lighten pointer-events-none transition-colors duration-1000"
          style={{ 
            background: \`radial-gradient(circle at 50% 0%, \${dominantColor} 0%, transparent 70%)\` 
          }}
        />
      )}
`.trim();

const newAura = `
      {dominantColor && (
        <motion.div
          className="absolute inset-0 pointer-events-none overflow-hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1 }}
        >
          {/* Main Top Aura */}
          <motion.div 
            className="absolute -inset-[30%] opacity-30 dark:opacity-40 mix-blend-screen dark:mix-blend-lighten transition-colors duration-1000"
            style={{ 
              background: \`radial-gradient(ellipse at 50% 20%, \${dominantColor} 0%, transparent 60%)\` 
            }}
            animate={{
              scale: [1, 1.15, 0.9, 1.05, 1],
              opacity: [0.7, 1, 0.6, 0.9, 0.7],
              x: ['0%', '3%', '-3%', '1%', '0%'],
              y: ['0%', '2%', '-2%', '1%', '0%'],
            }}
            transition={{
              duration: 12,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
          {/* Secondary offset flowing aura */}
          <motion.div 
            className="absolute -inset-[30%] opacity-20 dark:opacity-30 mix-blend-screen dark:mix-blend-lighten transition-colors duration-1000"
            style={{ 
              background: \`radial-gradient(ellipse at 60% 40%, \${dominantColor} 0%, transparent 50%)\` 
            }}
            animate={{
              scale: [1.1, 0.85, 1.2, 0.95, 1.1],
              opacity: [0.5, 0.8, 0.4, 0.7, 0.5],
              x: ['-2%', '4%', '-1%', '3%', '-2%'],
              y: ['3%', '-3%', '1%', '-4%', '3%'],
            }}
            transition={{
              duration: 18,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
        </motion.div>
      )}
`.trim();

code = code.replace(oldAura, newAura);
fs.writeFileSync('src/components/ExpandedPlayer.tsx', code);
