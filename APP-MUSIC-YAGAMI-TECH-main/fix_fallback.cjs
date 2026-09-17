const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const target1 = `  const [activeTab, setActiveTab] = useState<'home' | 'search' | 'library' | 'downloads' | 'settings'>('home');
  const [globalOverlay, setGlobalOverlay] = useState<{ type: 'album'|'artist'|'playlist', id: string } | null>(null);`;

const replacement1 = `  const [activeTab, setActiveTab] = useState<'home' | 'search' | 'library' | 'downloads' | 'settings'>('home');
  const [globalOverlay, setGlobalOverlay] = useState<{ type: 'album'|'artist'|'playlist', id: string } | null>(null);
  const [nativePluginAvailable, setNativePluginAvailable] = useState(Capacitor.isNativePlatform());`;

const target2 = `        if (Capacitor.isNativePlatform() && LiquidTabBarNative) {
          await LiquidTabBarNative.initializeTabBar({ activeTab: 'home' }).catch(e => console.warn(e));`;

const replacement2 = `        if (Capacitor.isNativePlatform() && LiquidTabBarNative) {
          try {
            await LiquidTabBarNative.initializeTabBar({ activeTab: 'home' });
            setNativePluginAvailable(true);
          } catch(e) {
            console.warn("Native plugin failed or missing, falling back to React component:", e);
            setNativePluginAvailable(false);
          }`;

const target3 = `{!Capacitor.isNativePlatform() && <LiquidTabBar activeTab={activeTab} setActiveTab={setActiveTab} />}`;
const replacement3 = `{!nativePluginAvailable && <LiquidTabBar activeTab={activeTab} setActiveTab={setActiveTab} />}`;

code = code.replace(target1, replacement1);
code = code.replace(target2, replacement2);
code = code.replace(target3, replacement3);
fs.writeFileSync('src/App.tsx', code);
console.log("Added native plugin fallback!");
