function extractBestColor(data) {
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
       
       // Reject practically black or practically white
       if (luma > 30 && luma < 225) {
           // We prefer vibrant colors (saturation) 
           // and we prefer colors that are somewhat bright but not washed out.
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
       // Optional: boost lightness if it's still somewhat dark for better visualizer popping
       return bestColor;
    } else {
       // Fallback to average but ensure minimum lightness
       const luma = 0.299 * avgR + 0.587 * avgG + 0.114 * avgB;
       if (luma < 50) {
           avgR = Math.max(avgR, 100); avgG = Math.max(avgG, 100); avgB = Math.max(avgB, 100);
       } else if (luma > 220) {
           avgR = Math.min(avgR, 180); avgG = Math.min(avgG, 180); avgB = Math.min(avgB, 180);
       }
       return [avgR, avgG, avgB];
    }
}
console.log(extractBestColor([0,0,0,255, 255,255,255,255, 128,128,128,255, 200,50,50,255]));
console.log(extractBestColor([10,10,10,255, 20,20,20,255])); // mostly black
