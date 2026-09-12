const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(
  "await LiquidTabBarNative.initializeTabBar({ activeTab: 'home' }).catch(console.error);",
  `await LiquidTabBarNative.initializeTabBar({ activeTab: 'home' }).then(() => alert('TabBar Initialized successfully')).catch(e => alert('Init Error: ' + e));`
);

fs.writeFileSync('src/App.tsx', code);
