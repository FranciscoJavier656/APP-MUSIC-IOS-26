import { motion, AnimatePresence, Reorder } from 'motion/react';
import React, { useEffect, useState } from 'react';
import { ChevronDown, Info, Download, MoreHorizontal, Heart, Cast, Timer } from 'lucide-react';
import EqualizerPanel from './EqualizerPanel';
import { usePlayer } from './PlayerContext';
import { Capacitor, registerPlugin } from '@capacitor/core';
import { getImageSrc } from '../lib/image';
import { OfflineImage } from './OfflineImage';
import { toggleFavoriteTrack } from '../lib/qobuz';

import PlayerHeader from './player/PlayerHeader';
import PlayerArtwork from './player/PlayerArtwork';
import PlayerProgress from './player/PlayerProgress';
import PlayerControls from './player/PlayerControls';

export default function ExpandedPlayer() {
  const { 
    currentTrack, playTrack,
    isExpanded, setIsExpanded,
    queue, setQueue, setContextMenuTrack, setDownloadItem
  } = usePlayer();

  const [dominantColor, setDominantColor] = useState<string | null>(null);
  const [showMetadata, setShowMetadata] = useState(false);
  const [showQueue, setShowQueue] = useState(false);
  const [showEQ, setShowEQ] = useState(false);
  
  const [isFavorite, setIsFavorite] = useState(false);
  
  const [sleepTimer, setSleepTimer] = useState<number | null>(null);
  const sleepTimerTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const toggleSleepTimer = () => {
    // Cycle: null -> 15 -> 30 -> 60 -> null
    const nextTimer = sleepTimer === null ? 15 : sleepTimer === 15 ? 30 : sleepTimer === 30 ? 60 : null;
    setSleepTimer(nextTimer);
    
    if (sleepTimerTimeoutRef.current) clearTimeout(sleepTimerTimeoutRef.current);
    
    if (nextTimer !== null) {
      sleepTimerTimeoutRef.current = setTimeout(() => {
        // Pause playback when timer ends
        const audio = document.getElementById('audio-element') as HTMLAudioElement;
        if (audio) audio.pause();
        // The store handles togglePlay, but calling pause() directly on audio is safer from inside a timeout if state is stale
        // Best approach is using custom event or standard DOM method
        document.dispatchEvent(new CustomEvent('pause-playback'));
        setSleepTimer(null);
      }, nextTimer * 60 * 1000);
    }
  };
  
  const handleFavoriteToggle = async (e: React.MouseEvent) => {
     e.stopPropagation();
     const newState = !isFavorite;
     setIsFavorite(newState);
     try {
         await toggleFavoriteTrack(currentTrack.id, !newState);
     } catch(err) {
         setIsFavorite(!newState); // revert on error
     }
  };
  
  // Swipe gesture state
  const [touchStartY, setTouchStartY] = useState(0);
  const [touchOffsetY, setTouchOffsetY] = useState(0);
  
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartY(e.touches[0].clientY);
    setTouchOffsetY(0);
  };
  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartY === 0) return;
    const currentY = e.touches[0].clientY;
    const diff = currentY - touchStartY;
    if (diff > 0) {
      setTouchOffsetY(diff);
    }
  };
  const handleTouchEnd = () => {
    if (touchOffsetY > 120) {
      setIsExpanded(false);
    }
    setTouchOffsetY(0);
    setTouchStartY(0);
  };

  useEffect(() => {
    import('../lib/eventBus').then(({ default: bus }) => {
      if (isExpanded) {
        (window as any).isPlayerExpanded = true;
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
        (window as any).isPlayerExpanded = false;
        if ((window as any).isGlobalOverlayActive) return;
        
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
    });
  }, [isExpanded]);

  if (!currentTrack) return null;

  return (
    <AnimatePresence>
      {isExpanded && (
        <motion.div
          initial={{ y: "100%", opacity: 0 }}
          animate={{ y: touchOffsetY > 0 ? touchOffsetY : 0, opacity: 1 }}
          exit={{ y: "100%", opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 250 }}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          className="fixed inset-0 z-[60] bg-[#F2F2F7] dark:bg-[#000000] flex flex-col pt-12 pb-8 px-6 sm:px-12"
        >
      {dominantColor && (
        <div 
          id="player-bg-glow"
          className="absolute inset-0 mix-blend-screen dark:mix-blend-lighten pointer-events-none origin-top"
          style={{ 
            background: `radial-gradient(circle at 50% 0%, ${dominantColor} 0%, transparent 80%)`,
            opacity: 0.45,
            filter: 'saturate(1.8) brightness(1.25)'
          }}
        />
      )}

      {/* Header */}
      <PlayerHeader 
         onClose={() => setIsExpanded(false)}
         onOpenEQ={() => setShowEQ(true)}
         onOpenQueue={() => setShowQueue(true)}
      />

      {/* Artwork & Canvas */}
      <PlayerArtwork dominantColor={dominantColor} setDominantColor={setDominantColor} />

      {/* Track Info & Controls */}
      <div className="mt-2 mb-8 relative z-10">
        <div className="flex items-center justify-between mb-6">
          {/* Left: Title, Artist and Badge */}
          <div className="pr-4 flex-1 min-w-0">
            <h2 id="player-title" className="text-2xl sm:text-3xl font-bold text-black dark:text-white truncate tracking-tight transition-transform duration-75">{currentTrack.title}</h2>
            <div className="flex items-center gap-3 mt-1.5">
              <p className="text-lg text-black/60 dark:text-white/60 truncate">{currentTrack.artist}</p>
              
              <div className="relative flex-shrink-0">
                <button 
                  onClick={() => setShowMetadata(!showMetadata)}
                  className="px-2 py-0.5 bg-black/5 dark:bg-white/10 rounded-sm text-[9px] font-bold tracking-widest text-black/80 dark:text-white/80 border border-black/10 dark:border-white/10 uppercase hover:bg-black/10 dark:hover:bg-white/20 transition-colors flex items-center"
                >
                  Lossless
                </button>
                {showMetadata && (
                  <div className="absolute bottom-full left-0 mb-3 p-4 bg-white/95 dark:bg-[#1a1a1a]/95 backdrop-blur-xl shadow-2xl rounded-2xl border border-black/5 dark:border-white/5 w-56 text-left z-50">
                     <h4 className="font-bold text-sm mb-3 text-black dark:text-white flex items-center gap-2">
                       <Info className="w-4 h-4" /> Calidad
                     </h4>
                     <div className="space-y-2 text-xs text-black/70 dark:text-white/70">
                       <p className="flex justify-between"><span>Formato:</span> <span className="font-mono font-medium">FLAC</span></p>
                       <p className="flex justify-between"><span>Frecuencia:</span> <span className="font-mono font-medium">44.1 kHz</span></p>
                       <p className="flex justify-between"><span>Prof:</span> <span className="font-mono font-medium">16-Bit</span></p>
                     </div>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Right: Actions */}
          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
            <button 
              onClick={(e) => { e.stopPropagation(); setDownloadItem({item: currentTrack, type: 'track'}); }}
              className="w-10 h-10 flex-shrink-0 rounded-full bg-black/5 dark:bg-white/10 flex items-center justify-center text-black dark:text-white hover:bg-black/10 dark:hover:bg-white/20 transition-colors"
            >
              <Download className="w-5 h-5" />
            </button>
            <motion.button 
              whileTap={{ scale: 0.8 }}
              onClick={handleFavoriteToggle}
              className="w-10 h-10 flex-shrink-0 rounded-full bg-black/5 dark:bg-white/10 flex items-center justify-center hover:bg-black/10 dark:hover:bg-white/20 transition-colors"
            >
              <Heart className={`w-5 h-5 transition-colors ${isFavorite ? 'fill-red-500 text-red-500' : 'text-black dark:text-white'}`} />
            </motion.button>
          </div>
        </div>

        {/* Progress */}
        <PlayerProgress dominantColor={dominantColor} />

        {/* Main Controls */}
        <PlayerControls dominantColor={dominantColor} />
        
        {/* Secondary Controls (Bottom) */}
        <div className="flex items-center justify-between px-6 sm:px-10 mt-6">
           <button className="flex flex-col items-center gap-1.5 text-black/40 dark:text-white/40 hover:text-black/80 dark:hover:text-white/80 transition-colors">
              <Cast className="w-5 h-5" />
              <span className="text-[10px] font-semibold tracking-wider">AIRPLAY</span>
           </button>
           <button onClick={toggleSleepTimer} className={`flex flex-col items-center gap-1.5 transition-colors ${sleepTimer ? 'text-black dark:text-white' : 'text-black/40 dark:text-white/40 hover:text-black/80 dark:hover:text-white/80'}`}>
              <Timer className="w-5 h-5" />
              <span className="text-[10px] font-semibold tracking-wider">
                {sleepTimer ? `${sleepTimer} MIN` : 'SLEEP'}
              </span>
           </button>
        </div>
      </div>

      {/* Equalizer Panel */}
      <EqualizerPanel 
        isVisible={showEQ} 
        onClose={() => setShowEQ(false)} 
        dominantColor={dominantColor} 
      />

      {/* Queue Modal */}
      <div 
        className={`absolute inset-0 z-50 bg-white dark:bg-[#121212] p-6 flex flex-col transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] ${showQueue ? 'translate-y-0' : 'translate-y-full'}`}
      >
          <div className="flex items-center justify-between mb-6 pt-6 relative z-10">
            <h3 className="text-2xl font-bold text-black dark:text-white tracking-tight">A continuación</h3>
            <button onClick={() => setShowQueue(false)} className="p-2 -mr-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 text-black dark:text-white transition-colors">
              <ChevronDown className="w-8 h-8" />
            </button>
          </div>
          {dominantColor && (
            <div 
              className="absolute inset-0 opacity-[0.08] dark:opacity-[0.15] mix-blend-screen dark:mix-blend-lighten pointer-events-none"
              style={{ background: `radial-gradient(circle at 100% 0%, ${dominantColor} 0%, transparent 60%)` }}
            />
          )}
          <div className="flex-1 overflow-y-auto pb-20">
            <Reorder.Group axis="y" values={queue} onReorder={setQueue} className="space-y-4">
              {queue.map((track) => {
                const isPlayingQueue = currentTrack?.id === track.id;
                return (
                  <Reorder.Item 
                    key={track.id} 
                    value={track} 
                    className={`flex items-center gap-4 p-3 rounded-2xl cursor-pointer hover:bg-black/5 dark:hover:bg-white/10 transition-colors ${isPlayingQueue ? 'bg-black/5 dark:bg-white/10' : ''}`}
                    onClick={() => playTrack(track)}
                    whileDrag={{ scale: 1.05, boxShadow: "0 10px 25px rgba(0,0,0,0.2)" }}
                  >
                    <OfflineImage localPath={track.localCoverPath || track.original?.localCoverPath} remoteUrl={getImageSrc(track?.album?.image || track?.image)} alt={track.title} className="w-14 h-14 rounded-xl object-cover shadow-sm pointer-events-none" />
                    <div className="flex-1 min-w-0">
                      <p className={`font-bold truncate ${isPlayingQueue ? 'text-black dark:text-white' : 'text-black/80 dark:text-white/80'}`}>
                        {track.title}
                      </p>
                      <p className="text-sm text-black/50 dark:text-white/50 truncate">{track.artist}</p>
                    </div>
                    {isPlayingQueue ? (
                      <div className="w-4 h-4 flex items-end justify-between gap-[2px]">
                        <div className="w-[3px] bg-black dark:bg-white rounded-full animate-[bounce_1s_infinite] h-2"></div>
                        <div className="w-[3px] bg-black dark:bg-white rounded-full animate-[bounce_1s_infinite_0.2s] h-4"></div>
                        <div className="w-[3px] bg-black dark:bg-white rounded-full animate-[bounce_1s_infinite_0.4s] h-3"></div>
                      </div>
                    ) : (
                      <div className="w-4 h-4 flex flex-col justify-center gap-1 opacity-30 cursor-grab active:cursor-grabbing" onClick={(e) => e.stopPropagation()}>
                        <div className="w-4 h-0.5 bg-black dark:bg-white rounded-full"></div>
                        <div className="w-4 h-0.5 bg-black dark:bg-white rounded-full"></div>
                        <div className="w-4 h-0.5 bg-black dark:bg-white rounded-full"></div>
                      </div>
                    )}
                  </Reorder.Item>
                );
              })}
            </Reorder.Group>
          </div>
      </div>
      </motion.div>
      )}
    </AnimatePresence>
  );
}
