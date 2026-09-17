const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const target1 = `  useEffect(() => {
    let listener = null;
    const initPlugin = async () => {`;

const replacement1 = `  useEffect(() => {
    let listener = null;
    const initPlugin = async () => {
      if (isAppLoading) return;`;

const target2 = `    initPlugin();
    
    return () => { `;

const replacement2 = `    initPlugin();
    
    return () => { `;

const target3 = `{!nativePluginAvailable && <LiquidTabBar activeTab={activeTab} setActiveTab={setActiveTab} />}`;
const replacement3 = `{!isAppLoading && !nativePluginAvailable && <LiquidTabBar activeTab={activeTab} setActiveTab={setActiveTab} />}`;

code = code.replace(target1, replacement1);
code = code.replace(target3, replacement3);

// We need to add isAppLoading to the dependency array
const target4 = `    };
  }, []);`;
const replacement4 = `    };
  }, [isAppLoading]);`;

code = code.replace(target4, replacement4);

fs.writeFileSync('src/App.tsx', code);
console.log("Patched App.tsx for isAppLoading!");
