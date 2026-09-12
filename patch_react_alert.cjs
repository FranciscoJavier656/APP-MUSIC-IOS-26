const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const target = `            await LiquidTabBarNative.initializeTabBar({ activeTab: 'home' }).catch(console.error);`;

const replacement = `            await LiquidTabBarNative.initializeTabBar({ activeTab: 'home' }).catch(e => {
              console.error(e);
              alert("SWIFT PLUGIN ERROR: " + e.message);
            });`;

code = code.replace(target, replacement);
fs.writeFileSync('src/App.tsx', code);
