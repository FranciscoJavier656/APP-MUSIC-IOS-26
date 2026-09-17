const fs = require('fs');
let code = fs.readFileSync('src/components/ExpandedPlayer.tsx', 'utf8');

const regex = /\/\/ 2\. Draw Analyser \(Native iOS vDSP\)[\s\S]*?\}\s*animationId = requestAnimationFrame\(draw\);/;

const originalDrawLogic = `// 2. Draw Analyser (Native iOS vDSP)
        if (ctx && canvas && (canvas as any).nativeFftData) {
          const rawDataArray = (canvas as any).nativeFftData;
          const bufferLength = rawDataArray.length;
          
          if (!(canvas as any).smoothedFftData) {
             (canvas as any).smoothedFftData = new Float32Array(bufferLength);
          }
          const smoothed = (canvas as any).smoothedFftData;
          
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
        }

        animationId = requestAnimationFrame(draw);`;

if (regex.test(code)) {
    code = code.replace(regex, originalDrawLogic);
    fs.writeFileSync('src/components/ExpandedPlayer.tsx', code);
    console.log("Stardust reverted successfully.");
} else {
    console.log("Regex didn't match.");
}
