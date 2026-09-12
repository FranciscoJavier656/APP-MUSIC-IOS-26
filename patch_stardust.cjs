const fs = require('fs');
let code = fs.readFileSync('src/components/ExpandedPlayer.tsx', 'utf8');

const regex = /\/\/ 2\. Draw Analyser \(Native iOS vDSP\)[\s\S]*?\}\s*animationId = requestAnimationFrame\(draw\);/;

const newDrawLogic = `// 2. Draw Analyser (Native iOS vDSP)
        if (ctx && canvas && (canvas as any).nativeFftData) {
          const rawDataArray = (canvas as any).nativeFftData;
          const bufferLength = rawDataArray.length;
          
          if (!(canvas as any).smoothedFftData) {
             (canvas as any).smoothedFftData = new Float32Array(bufferLength);
             (canvas as any).particles = [];
          }
          const smoothed = (canvas as any).smoothedFftData;
          const particles = (canvas as any).particles;
          
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          
          // Slight padding between bars
          const barWidth = (canvas.width / bufferLength);
          let x = 0;
          
          const isDarkMode = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
          let r = isDarkMode ? 255 : 0;
          let g = isDarkMode ? 255 : 0;
          let b = isDarkMode ? 255 : 0;
          
          if (dominantColorRef.current) {
            const match = dominantColorRef.current.match(/rgb\\((\\d+),\\s*(\\d+),\\s*(\\d+)\\)/);
            if (match) {
              r = parseInt(match[1]);
              g = parseInt(match[2]);
              b = parseInt(match[3]);
            }
          }
          const baseRgb = \`\${r}, \${g}, \${b}\`;
          
          for (let i = 0; i < bufferLength; i++) {
            // If paused, force the target value to 0 so it decays smoothly
            const targetValue = isPlayingRef.current ? rawDataArray[i] : 0;
            
            // Exponential smoothing for buttery smooth animation
            smoothed[i] = smoothed[i] * 0.70 + targetValue * 0.30;
            
            let barHeight = (smoothed[i] / 255) * canvas.height;
            if (barHeight < 3) barHeight = 3; // Minimum height for silence
            
            // --- Cinematic Stardust Particles Emission ---
            // Emit particles on aggressive peaks (targetValue > 170)
            if (targetValue > 170 && Math.random() > 0.75) {
              particles.push({
                x: x + (barWidth / 2) + (Math.random() * 6 - 3),
                y: canvas.height - barHeight,
                vx: (Math.random() - 0.5) * 1.5,
                vy: -(Math.random() * 2.5 + 1), // floating upwards
                life: 1, // Opacity
                decay: Math.random() * 0.02 + 0.01,
                size: Math.random() * 2 + 1,
              });
            }
            
            ctx.fillStyle = \`rgba(\${baseRgb}, \${0.15 + (smoothed[i]/255)*0.85})\`; 
            ctx.beginPath();
            if (ctx.roundRect) {
              ctx.roundRect(x, canvas.height - barHeight, barWidth - 2, barHeight, [4, 4, 0, 0]);
            } else {
              ctx.fillRect(x, canvas.height - barHeight, barWidth - 2, barHeight);
            }
            ctx.fill();
            x += barWidth;
          }
          
          // --- Update and Draw Particles ---
          for (let p = particles.length - 1; p >= 0; p--) {
            const part = particles[p];
            part.x += part.vx;
            part.y += part.vy;
            part.life -= part.decay;
            
            if (part.life <= 0) {
              particles.splice(p, 1);
            } else {
              ctx.beginPath();
              ctx.arc(part.x, part.y, part.size, 0, Math.PI * 2);
              // Adding a subtle glow effect to the particles
              ctx.shadowBlur = 6;
              ctx.shadowColor = \`rgba(\${baseRgb}, \${part.life})\`;
              ctx.fillStyle = \`rgba(255, 255, 255, \${part.life})\`;
              ctx.fill();
              ctx.shadowBlur = 0; // reset for next drawing operations
            }
          }
        }

        animationId = requestAnimationFrame(draw);`;

if (regex.test(code)) {
    code = code.replace(regex, newDrawLogic);
    fs.writeFileSync('src/components/ExpandedPlayer.tsx', code);
    console.log("Stardust logic injected successfully.");
} else {
    console.log("Regex didn't match.");
}
