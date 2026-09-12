const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

if (!code.includes("import { Capacitor, registerPlugin }")) {
  code = code.replace(
    "import { LiquidTabBar } from './components/LiquidTabBar';",
    "import { LiquidTabBar } from './components/LiquidTabBar';\nimport { Capacitor, registerPlugin } from '@capacitor/core';"
  );
}

if (!code.includes("const LiquidTabBarNative = registerPlugin")) {
  code = code.replace(
    "export default function App() {",
    "const LiquidTabBarNative = registerPlugin('LiquidTabBar');\n\nexport default function App() {"
  );
}

const hookStr = `
  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      LiquidTabBarNative.initializeTabBar({ activeTab: 'home' });
      const listener = LiquidTabBarNative.addListener('onTabSelected', (info) => {
        setActiveTab(info.tabId);
      });
      return () => { listener.then(l => l.remove()); };
    }
  }, []);

  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      LiquidTabBarNative.updateTab({ tabId: activeTab });
    }
  }, [activeTab]);
`;

if (!code.includes('LiquidTabBarNative.initializeTabBar')) {
  code = code.replace(
    "const [activeTab, setActiveTab] = useState",
    hookStr + "\n  const [activeTab, setActiveTab] = useState"
  );
}

code = code.replace(
  "<LiquidTabBar activeTab={activeTab} setActiveTab={setActiveTab} />",
  "{!Capacitor.isNativePlatform() && <LiquidTabBar activeTab={activeTab} setActiveTab={setActiveTab} />}"
);

fs.writeFileSync('src/App.tsx', code);
console.log("Patched App.tsx for native plugin!");
