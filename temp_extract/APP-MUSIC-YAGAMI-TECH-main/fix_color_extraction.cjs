const fs = require('fs');

let code = fs.readFileSync('src/components/ExpandedPlayer.tsx', 'utf8');

const targetContent = `      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = 1;
        canvas.height = 1;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, 1, 1);
          const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
          setDominantColor(\`rgb(\${r}, \${g}, \${b})\`);
        }
      };`;

const newContent = `      img.onload = () => {
        const canvas = document.createElement('canvas');
        const sampleSize = 32; // Extract from a 32x32 grid
        canvas.width = sampleSize;
        canvas.height = sampleSize;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        
        ctx.drawImage(img, 0, 0, sampleSize, sampleSize);
        const data = ctx.getImageData(0, 0, sampleSize, sampleSize).data;
        
        let bestColor = null;
        let maxScore = -1;
        let avgR = 0, avgG = 0, avgB = 0;
        
        for (let i = 0; i < data.length; i += 4) {
           const r = data[i], g = data[i+1], b = data[i+2];
           avgR += r; avgG += g; avgB += b;
           
           const luma = 0.299 * r + 0.587 * g + 0.114 * b;
           const max = Math.max(r, g, b);
           const min = Math.min(r, g, b);
           const saturation = max === 0 ? 0 : (max - min) / max;
           
           // Ignore colors that are too dark (black) or too bright (white)
           if (luma > 30 && luma < 225) {
               // Prioritize vibrant colors (high saturation) that aren't too dark
               const score = (saturation * 200) + (luma < 128 ? luma : 255 - luma);
               if (score > maxScore) {
                   maxScore = score;
                   bestColor = [r, g, b];
               }
           }
        }
        
        const count = data.length / 4;
        avgR = Math.floor(avgR / count);
        avgG = Math.floor(avgG / count);
        avgB = Math.floor(avgB / count);
        
        if (bestColor) {
           setDominantColor(\`rgb(\${bestColor[0]}, \${bestColor[1]}, \${bestColor[2]})\`);
        } else {
           // If no vibrant/good color found (e.g. image is completely black/white)
           // Ensure it has a minimum lightness so it doesn't disappear in dark backgrounds
           const luma = 0.299 * avgR + 0.587 * avgG + 0.114 * avgB;
           if (luma < 50) {
               avgR = Math.max(avgR, 120); 
               avgG = Math.max(avgG, 120); 
               avgB = Math.max(avgB, 120);
           } else if (luma > 220) {
               avgR = Math.min(avgR, 150); 
               avgG = Math.min(avgG, 150); 
               avgB = Math.min(avgB, 150);
           }
           setDominantColor(\`rgb(\${avgR}, \${avgG}, \${avgB})\`);
        }
      };`;

if(code.includes(targetContent)) {
    code = code.replace(targetContent, newContent);
    fs.writeFileSync('src/components/ExpandedPlayer.tsx', code);
    console.log("Color extraction updated");
} else {
    console.error("Target content not found!");
}
