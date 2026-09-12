const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const targetInit = `      try {
        if (Capacitor.isNativePlatform() && LiquidTabBarNative) {
          try {
            await LiquidTabBarNative.initializeTabBar({ activeTab: 'home' });
            setNativePluginAvailable(true);
          } catch(e) {
            console.warn("Native plugin failed or missing, falling back to React component:", e);
            setNativePluginAvailable(false);
          }
          listener = await LiquidTabBarNative.addListener('onTabSelected', (info) => {
            if (info && info.tabId) {
              setActiveTab(info.tabId);
            }
          }).catch(e => {
             console.warn(e);
             return null;
          });
        }
      } catch(e) {
        console.error("Native plugin init error:", e);
      }`;

const replacementInit = `      if (Capacitor.isNativePlatform() && LiquidTabBarNative) {
        // ALWAYS use native on iOS, ZERO fallback to React
        await LiquidTabBarNative.initializeTabBar({ activeTab: 'home' }).catch(console.error);
        listener = await LiquidTabBarNative.addListener('onTabSelected', (info) => {
          if (info && info.tabId) {
            setActiveTab(info.tabId);
          }
        }).catch(console.warn);
      }`;

code = code.replace(targetInit, replacementInit);

const targetJSX = `{(showUI && !nativePluginAvailable) && <LiquidTabBar activeTab={activeTab} setActiveTab={setActiveTab} />}`;
const replacementJSX = `{(showUI && !Capacitor.isNativePlatform()) && <LiquidTabBar activeTab={activeTab} setActiveTab={setActiveTab} />}`;

code = code.replace(targetJSX, replacementJSX);

const targetState = `  const [nativePluginAvailable, setNativePluginAvailable] = useState(Capacitor.isNativePlatform());\n`;
code = code.replace(targetState, '');

fs.writeFileSync('src/App.tsx', code);
console.log("Removed fallback logic completely!");
