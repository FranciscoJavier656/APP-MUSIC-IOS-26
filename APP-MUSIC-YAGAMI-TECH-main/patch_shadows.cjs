const fs = require('fs');
const path = 'src/components/LiquidTabBar.tsx';
let content = fs.readFileSync(path, 'utf8');

// Remove outer shadow, keep inner reflections for 3D liquid look
content = content.replace(
  "bg-[#007AFF] shadow-[inset_0_2px_4px_rgba(255,255,255,0.5),_inset_0_-2px_4px_rgba(0,0,0,0.2),_0_4px_10px_rgba(0,122,255,0.4)]",
  "bg-[#007AFF] shadow-[inset_0_2px_4px_rgba(255,255,255,0.5),_inset_0_-2px_4px_rgba(0,0,0,0.2)]"
);

fs.writeFileSync(path, content, 'utf8');
console.log("Updated shadows!");
