const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const target1 = `  const [isAppLoading, setIsAppLoading] = useState(true);`;
const replacement1 = `  const [isAppLoading, setIsAppLoading] = useState(true);
  const [showUI, setShowUI] = useState(false);`;

const target2 = `  useEffect(() => {
    const timer = setTimeout(() => setIsAppLoading(false), 2500);
    return () => clearTimeout(timer);
  }, []);`;
const replacement2 = `  useEffect(() => {
    const timer = setTimeout(() => {
      setIsAppLoading(false);
      setTimeout(() => setShowUI(true), 800); // Wait for 0.8s exit animation to finish
    }, 2500);
    return () => clearTimeout(timer);
  }, []);`;

const target3 = `{!isAppLoading && !nativePluginAvailable && <LiquidTabBar activeTab={activeTab} setActiveTab={setActiveTab} />}`;
const replacement3 = `{(showUI && !nativePluginAvailable) && <LiquidTabBar activeTab={activeTab} setActiveTab={setActiveTab} />}`;

code = code.replace(target1, replacement1);
code = code.replace(target2, replacement2);
code = code.replace(target3, replacement3);

// Update native plugin init dependency
const target4 = `      if (isAppLoading) return;`;
const replacement4 = `      if (!showUI) return;`;

const target5 = `  }, [isAppLoading]);`;
const replacement5 = `  }, [showUI]);`;

code = code.replace(target4, replacement4);
code = code.replace(target5, replacement5);

fs.writeFileSync('src/App.tsx', code);
console.log("Patched App.tsx for smooth UI entry!");
