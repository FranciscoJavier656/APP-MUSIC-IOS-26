const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const target = `  useEffect(() => {
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

  const [activeTab, setActiveTab] = useState<'home' | 'search' | 'library' | 'downloads' | 'settings'>('home');
  const [globalOverlay, setGlobalOverlay] = useState<{ type: 'album'|'artist'|'playlist', id: string } | null>(null);`;

const replacement = `  const [activeTab, setActiveTab] = useState<'home' | 'search' | 'library' | 'downloads' | 'settings'>('home');
  const [globalOverlay, setGlobalOverlay] = useState<{ type: 'album'|'artist'|'playlist', id: string } | null>(null);

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
  }, [activeTab]);`;

code = code.replace(target, replacement);
fs.writeFileSync('src/App.tsx', code);
console.log("Fixed init error!");
