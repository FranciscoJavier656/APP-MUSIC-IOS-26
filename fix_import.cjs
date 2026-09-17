const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

if (!code.includes("import { LiquidTabBar }")) {
  code = code.replace("import MiniPlayer from './components/MiniPlayer';", "import MiniPlayer from './components/MiniPlayer';\nimport { LiquidTabBar } from './components/LiquidTabBar';");
  fs.writeFileSync('src/App.tsx', code);
  console.log("Import fixed!");
} else {
  console.log("Import already exists.");
}
