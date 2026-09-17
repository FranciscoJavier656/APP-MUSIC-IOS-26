const fs = require('fs');
let code = fs.readFileSync('src/components/LiquidTabBar.tsx', 'utf8');

const target = `  const isIOS = Capacitor.getPlatform() === 'ios';
  return (
    <div className={\`fixed left-0 w-full flex justify-center z-[100] pointer-events-none \${isIOS ? 'bottom-8' : 'bottom-6'}\`}>`;

const replacement = `  const isIOS = Capacitor.getPlatform() === 'ios';
  if (isIOS) return null; // Let Native Swift render the Liquid UI on iOS
  return (
    <div className={\`fixed left-0 w-full flex justify-center z-[100] pointer-events-none bottom-6\`}>`;

code = code.replace(target, replacement);

fs.writeFileSync('src/components/LiquidTabBar.tsx', code);
console.log("Patched LiquidTabBar web rendering exclusion for iOS!");
