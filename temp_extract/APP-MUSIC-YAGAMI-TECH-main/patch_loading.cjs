const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const target1 = `  useEffect(() => {
    let listener = null;
    const initPlugin = async () => {
      if (isAppLoading) return;
      try {
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
      }
    };
    initPlugin();
    
    return () => { 
      if (listener && typeof listener.remove === 'function') {
        listener.remove().catch(e => console.warn(e));
      }
    };
  }, [isAppLoading]);`;

// Make sure it doesn't render web either if it's loading
const target3 = `{!isAppLoading && !nativePluginAvailable && <LiquidTabBar activeTab={activeTab} setActiveTab={setActiveTab} />}`;

