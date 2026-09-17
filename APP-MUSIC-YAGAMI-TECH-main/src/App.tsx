import React, { useState, useEffect } from 'react';
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

  // ─── Native iOS 26 Liquid Glass TabBar (real Apple APIs) ───
  useEffect(() => {
    if (!showUI || !isNative || !LiquidTabBarNative) return;
    let listener: any = null;

    const initNative = async () => {
      try {
        await LiquidTabBarNative.initializeTabBar({ activeTab: 'home' });
        setUseNativeTabBar(true);
        console.log('⚡️ Native iOS 26 Liquid Glass TabBar initialized');

        listener = await LiquidTabBarNative.addListener('onTabSelected', (info: any) => {
          if (info?.tabId) setActiveTab(info.tabId);
        });
      } catch (e) {
        // Native plugin failed — React fallback will be used
        console.warn('Native LiquidTabBar unavailable, using React fallback:', e);
        setUseNativeTabBar(false);
      }
    };
    initNative();

    return () => {
      if (listener?.remove) listener.remove().catch(() => {});
    };
  }, [showUI]);

  // Sync active tab to native when changed from JS side
  useEffect(() => {
    if (!useNativeTabBar || !LiquidTabBarNative) return;
    LiquidTabBarNative.updateTab({ tabId: activeTab }).catch(() => {});
  }, [activeTab, useNativeTabBar]);

  useEffect(() => {
    const handleGlobalOverlay = (e: any) => {
      setGlobalOverlay(e.detail);
    };
    document.addEventListener('open-overlay', handleGlobalOverlay);
    return () => document.removeEventListener('open-overlay', handleGlobalOverlay);
  }, []);


  useEffect(() => {
    const handleNavigate = (e: any) => {
      if (e.detail) {
        setActiveTab(e.detail);
      }
    };
    window.addEventListener('navigate', handleNavigate);
    document.addEventListener('navigate', handleNavigate);
    return () => {
      window.removeEventListener('navigate', handleNavigate);
      document.removeEventListener('navigate', handleNavigate);
    };
  }, []);

  
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      try {
        return localStorage.getItem('theme') === 'dark' || 
           (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches);
      } catch (e) {
        console.warn("Storage error", e);
        return false;
      }
    }
    return false;
  });

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
        localStorage.setItem('theme', 'dark');
      } else {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('theme', 'light');
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
