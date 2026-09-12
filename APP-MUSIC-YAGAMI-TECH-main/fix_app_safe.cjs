const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const target1 = `  useEffect(() => {
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
  }, [activeTab]);`;

const replacement1 = `  useEffect(() => {
    let listener = null;
    const initPlugin = async () => {
      try {
        if (Capacitor.isNativePlatform() && LiquidTabBarNative) {
          await LiquidTabBarNative.initializeTabBar({ activeTab: 'home' }).catch(e => console.warn(e));
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
  }, []);

  useEffect(() => {
    try {
      if (Capacitor.isNativePlatform() && LiquidTabBarNative) {
        LiquidTabBarNative.updateTab({ tabId: activeTab }).catch(e => console.warn(e));
      }
    } catch(e) {
      console.error("Native plugin update error:", e);
    }
  }, [activeTab]);`;

code = code.replace(target1, replacement1);
fs.writeFileSync('src/App.tsx', code);
console.log("Made plugin calls completely safe!");
