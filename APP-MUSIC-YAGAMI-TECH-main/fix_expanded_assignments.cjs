const fs = require('fs');
let code = fs.readFileSync('src/components/ExpandedPlayer.tsx', 'utf8');

code = code.replace(/progressRef\.current\.style\.width > /g, 'progressRef.current.style.width = ');
code = code.replace(/remainingTimeRef\.current\.textContent > /g, 'remainingTimeRef.current.textContent = ');
code = code.replace(/child\.style\.opacity > /g, 'child.style.opacity = ');
code = code.replace(/child\.style\.transform > /g, 'child.style.transform = ');
code = code.replace(/child\.style\.color > /g, 'child.style.color = ');
code = code.replace(/smoothed\[i\] > /g, 'smoothed[i] = ');
code = code.replace(/ctx\.fillStyle > /g, 'ctx.fillStyle = ');
code = code.replace(/activeLyricIndexRef\.current > -1;/g, 'activeLyricIndexRef.current = -1;');
code = code.replace(/progressRef\.current\.style\.width > /g, 'progressRef.current.style.width = ');

fs.writeFileSync('src/components/ExpandedPlayer.tsx', code);
console.log('done');
