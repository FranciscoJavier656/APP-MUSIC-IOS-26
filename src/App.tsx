import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { YagamiLoader } from './components/YagamiLoader';
import HomeTab from './components/HomeTab';
import SearchTab from './components/SearchTab';
import SettingsTab from './components/SettingsTab';
import LibraryTab from './components/LibraryTab';
import DownloadsTab from './components/DownloadsTab';
import AlbumView from './components/AlbumView';
import PlaylistView from './components/PlaylistView';
import ArtistView from './components/ArtistView';

import { PlayerProvider } from './components/PlayerContext';
import { DownloadProvider } from './lib/DownloadContext';
import { WifiOff } from 'lucide-react';
import { ErrorBoundary } from './components/ErrorBoundary';
import MiniPlayer from './components/MiniPlayer';
import { LiquidTabBar } from './components/LiquidTabBar';
import { Capacitor, registerPlugin } from '@capacitor/core';

const isNative = Capacitor.isNativePlatform();
const LiquidTabBarNative = isNative ? registerPlugin('LiquidTabBar') : null;
import bus from './lib/eventBus';


class RootErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    console.error("RootError:", error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return <div style={{padding: 20, color: 'red', background: 'white', height: '100vh', wordWrap: 'break-word'}}>
        <h1>Fatal Error</h1>
        <pre>{this.state.error?.toString()}</pre>
        <pre>{this.state.error?.stack}</pre>
      </div>;
    }
    return this.props.children;
  }
}

export default function App() {
  return <RootErrorBoundary><AppContent /></RootErrorBoundary>;
}

function AppContent() {
  const [isAppLoading, setIsAppLoading] = useState(true);
  const [showUI, setShowUI] = useState(false);
  const [isOffline, setIsOffline] = useState(typeof navigator !== 'undefined' ? !navigator.onLine : false);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [showUI]);
  
  
  const [activeTab, setActiveTab] = useState<'home' | 'search' | 'library' | 'downloads' | 'settings'>('home');
  const [globalOverlay, setGlobalOverlay] = useState<{ type: 'album'|'artist'|'playlist', id: string } | null>(null);
  const [useNativeTabBar, setUseNativeTabBar] = useState(false);

  // ─── Native iOS 26 TabView with Liquid Glass (real Apple WWDC 2025 APIs) ───
  useEffect(() => {
    if (!showUI || !isNative || !LiquidTabBarNative) return;

    const initNative = async () => {
      try {
        await LiquidTabBarNative.initializeTabBar({ activeTab: 'home' });
        setUseNativeTabBar(true);
        console.log('⚡️ Native iOS 26 SwiftUI TabView initialized (Liquid Glass)');
      } catch (e) {
        // Native plugin failed — React fallback will be used
        console.warn('Native TabView unavailable, using React fallback:', e);
        setUseNativeTabBar(false);
      }
    };
    initNative();

    // Listen for native tab changes from SwiftUI TabView → React
    const handleNativeTogglePlay = () => {
      bus.emit('toggle-play');
    };
    const handleNativeExpandPlayer = () => {
      bus.emit('expand-player');
    };
    
    document.addEventListener('native-toggle-play', handleNativeTogglePlay);
    document.addEventListener('native-expand-player', handleNativeExpandPlayer);

    return () => {
      document.removeEventListener('native-toggle-play', handleNativeTogglePlay);
      document.removeEventListener('native-expand-player', handleNativeExpandPlayer);
    };
  }, [showUI]);

  // Sync active tab to native when changed from JS side
  useEffect(() => {
    if (!useNativeTabBar || !LiquidTabBarNative) return;
    LiquidTabBarNative.updateTab({ tabId: activeTab }).catch(() => {});
  }, [activeTab, useNativeTabBar]);

  useEffect(() => {
    const handleGlobalOverlay = (detail: any) => {
      setGlobalOverlay(detail);
    };
    bus.on('open-overlay', handleGlobalOverlay);
    return () => bus.off('open-overlay', handleGlobalOverlay);
  }, []);


  const globalOverlayRef = useRef(globalOverlay);
  useEffect(() => { globalOverlayRef.current = globalOverlay; }, [globalOverlay]);

  useEffect(() => {
    const handleNavigate = (detail: any) => {
      if (detail) {
        setActiveTab(detail);
      }
    };
    const handleWindowNavigate = (e: any) => {
      if (e.detail) {
        setActiveTab(e.detail);
      }
    };
    const handleHide = () => {
      // DIRECT OVERRIDE: Bypass Capacitor for instant iOS 26 UI hide
      try {
        if ((window as any).webkit?.messageHandlers?.LiquidTabBarDirect) {
          (window as any).webkit.messageHandlers.LiquidTabBarDirect.postMessage("hide");
        }
      } catch (e) {}

      if (LiquidTabBarNative) {
        LiquidTabBarNative.setHidden({ hidden: true }).catch(() => {});
        if (LiquidTabBarNative.hide) LiquidTabBarNative.hide().catch(() => {});
      }
    };
    const handleShow = () => {
      if ((window as any).isPlayerExpanded || globalOverlayRef.current) return;
      
      // DIRECT OVERRIDE: Bypass Capacitor for instant iOS 26 UI show
      try {
        if ((window as any).webkit?.messageHandlers?.LiquidTabBarDirect) {
          (window as any).webkit.messageHandlers.LiquidTabBarDirect.postMessage("show");
        }
      } catch (e) {}

      if (LiquidTabBarNative) {
        LiquidTabBarNative.setHidden({ hidden: false }).catch(() => {});
        if (LiquidTabBarNative.show) LiquidTabBarNative.show().catch(() => {});
      }
    };
    bus.on('navigate', handleNavigate);
    window.addEventListener('navigate', handleWindowNavigate);
    bus.on('tabbar:hide', handleHide);
    bus.on('tabbar:show', handleShow);
    return () => {
      bus.off('navigate', handleNavigate);
      window.removeEventListener('navigate', handleWindowNavigate);
      bus.off('tabbar:hide', handleHide);
      bus.off('tabbar:show', handleShow);
    };
  }, [useNativeTabBar]);

  useEffect(() => {
    (window as any).isGlobalOverlayActive = !!globalOverlay;
    if (globalOverlay) {
      bus.emit('tabbar:hide');
      try { 
        if (Capacitor.isNativePlatform()) { 
          const lt = registerPlugin('LiquidTabBar'); 
          lt.setHidden({ hidden: true }); 
          if (lt.hide) lt.hide(); 
          if ((window as any).webkit?.messageHandlers?.LiquidTabBarDirect) {
            (window as any).webkit.messageHandlers.LiquidTabBarDirect.postMessage("hide");
          }
        } 
      } catch(e){}
    } else {
      if ((window as any).isPlayerExpanded) return;
      bus.emit('tabbar:show');
      try { 
        if (Capacitor.isNativePlatform()) { 
          const lt = registerPlugin('LiquidTabBar'); 
          lt.setHidden({ hidden: false }); 
          if (lt.show) lt.show(); 
          if ((window as any).webkit?.messageHandlers?.LiquidTabBarDirect) {
            (window as any).webkit.messageHandlers.LiquidTabBarDirect.postMessage("show");
          }
        } 
      } catch(e){}
    }
  }, [globalOverlay]);

  
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      import('./lib/storage').then((storage) => {
        storage.getTheme().then((theme) => {
          if (theme === 'dark' || (!theme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
            setIsDarkMode(true);
          } else {
            setIsDarkMode(false);
          }
        });
      });
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsAppLoading(false);
      setTimeout(() => setShowUI(true), 800); // Wait for 0.8s exit animation to finish
    }, 2500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    try {
      if (isDarkMode) {
        document.documentElement.classList.add('dark');
        import('./lib/storage').then(s => s.setTheme('dark'));
      } else {
        document.documentElement.classList.remove('dark');
        import('./lib/storage').then(s => s.setTheme('light'));
      }
    } catch(e) {
      console.warn("Storage error", e);
    }
  }, [isDarkMode]);

  return (
    <DownloadProvider>
    <PlayerProvider>
      <div className="flex flex-col h-screen w-full bg-[#F2F2F7] dark:bg-[#000000] text-black dark:text-white font-sans sm:pb-0 overflow-hidden transition-colors duration-300 relative">
        <AnimatePresence>
          {isAppLoading && (
            <motion.div 
              key="loader"
              exit={{ opacity: 0, scale: 1.05, filter: "blur(10px)" }}
              transition={{ duration: 0.8, ease: "easeInOut" }}
              className="flex flex-col h-screen w-screen bg-[#F2F2F7] dark:bg-[#000000] items-center justify-center absolute inset-0 z-[100]"
            >
              <YagamiLoader />
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Main Content Area */}
        
        <AnimatePresence>
          {isOffline && (
            <motion.div
              initial={{ opacity: 0, y: -50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -50 }}
              className="absolute top-12 left-1/2 -translate-x-1/2 z-[90] bg-red-500/90 backdrop-blur-md text-white px-4 py-2 rounded-full text-xs font-semibold flex items-center gap-2 shadow-lg"
            >
              <WifiOff size={14} />
              Sin Conexión
            </motion.div>
          )}
        </AnimatePresence>
        <ErrorBoundary>
        <main className="flex-1 relative overflow-hidden">
          <div className={activeTab === 'home' ? 'block h-full' : 'hidden'}>
            <HomeTab />
          </div>
          <div className={activeTab === 'search' ? 'block h-full' : 'hidden'}>
            <SearchTab />
          </div>
          <div className={activeTab === 'library' ? 'block h-full' : 'hidden'}>
            <LibraryTab />
          </div>
          <div className={activeTab === 'downloads' ? 'block h-full' : 'hidden'}>
            <DownloadsTab />
          </div>
          <div className={activeTab === 'settings' ? 'block h-full' : 'hidden'}>
            <SettingsTab isDarkMode={isDarkMode} setIsDarkMode={setIsDarkMode} />
          </div>
        </main>
        </ErrorBoundary>

        <AnimatePresence>
          {globalOverlay && globalOverlay.type === 'album' && (
            <motion.div 
              key="global-album"
              initial={{ opacity: 0, x: "100%" }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: "100%" }} transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed inset-0 z-[80] bg-[#F2F2F7] dark:bg-[#000000]"
            >
              <AlbumView albumId={globalOverlay.id} onBack={() => setGlobalOverlay(null)} />
            </motion.div>
          )}
          {globalOverlay && globalOverlay.type === 'playlist' && (
            <motion.div 
              key="global-playlist"
              initial={{ opacity: 0, x: "100%" }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: "100%" }} transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed inset-0 z-[80] bg-[#F2F2F7] dark:bg-[#000000]"
            >
              <PlaylistView playlistId={globalOverlay.id} onBack={() => setGlobalOverlay(null)} />
            </motion.div>
          )}
          {globalOverlay && globalOverlay.type === 'artist' && (
            <motion.div 
              key="global-artist"
              initial={{ opacity: 0, x: "100%" }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: "100%" }} transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed inset-0 z-[80] bg-[#F2F2F7] dark:bg-[#000000]"
            >
              <ArtistView artistId={globalOverlay.id} onBack={() => setGlobalOverlay(null)} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Mini Player */}
        <MiniPlayer />

        {/* Liquid Glass Tab Bar
             iOS native: SwiftUI view using real Apple glassEffect APIs (handled by plugin)
             Web / fallback: React component with CSS liquid simulation */}
        {showUI && !useNativeTabBar && <LiquidTabBar activeTab={activeTab} setActiveTab={setActiveTab} />}
      </div>
    </PlayerProvider>
    </DownloadProvider>
  );
}
