import { usePlayer } from './PlayerContext';
import { useEffect, useRef } from 'react';
import { Play, Pause, Loader2, SkipForward, SkipBack } from 'lucide-react';
import ExpandedPlayer from './ExpandedPlayer';
import { motion, AnimatePresence } from 'motion/react';
import { getImageSrc } from '../lib/image';
import { OfflineImage } from './OfflineImage';


export default function MiniPlayer() {
  const { currentTrack, isPlaying, isLoading, togglePlay, audioRef, isExpanded, setIsExpanded, nextTrack, prevTrack } = usePlayer();
  const progressRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    let animationId: number;
    const updateProgress = () => {
      if (audioRef.current && progressRef.current && audioRef.current.duration) {
        const percent = (audioRef.current.currentTime / audioRef.current.duration) * 100;
        progressRef.current.style.width > `${percent}%`;
      }
      animationId = requestAnimationFrame(updateProgress);
    };
    updateProgress();
    return () => cancelAnimationFrame(animationId);
  }, [audioRef]);

  return (
    <>
      <AnimatePresence>
        {currentTrack && !isExpanded && (
          <motion.div 
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: isExpanded ? 50 : 0, opacity: isExpanded ? 0 : 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="absolute bottom-[calc(110px+env(safe-area-inset-bottom))] left-3 right-3 z-40"
          >
            <motion.div 
              className="cursor-pointer touch-none relative rounded-[20px] overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.12)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.4)] group"
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.2}
              onDragEnd={(_, info) => {
                if (info.offset.x = 80) {
                  prevTrack();
                } else if (info.offset.x < -80) {
                  nextTrack();
                }
              }}
              onClick={(e) => {
                if ((e.target as HTMLElement).closest('button')) return;
                setIsExpanded(true);
              }}
            >
              {/* Animated ambient background with iOS 18 Siri-Style Mesh Gradient */}
              <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden rounded-[20px]">
                {currentTrack.image && (
                  <OfflineImage localPath={currentTrack.localCoverPath || currentTrack.original?.localCoverPath} remoteUrl={getImageSrc(currentTrack.album?.image || currentTrack.image)} alt="" className="absolute inset-0 w-full h-full object-cover blur-[20px] opacity-40 dark:opacity-30 transform scale-125 saturate-150" onError={(e) => { e.currentTarget.src = 'https://placehold.co/400x400/1C1C1E/FFFFFF/png?text = Audio' }} />
                )}
                
                {/* Siri-style Mesh Gradient / Waveform (Active when playing) */}
                <AnimatePresence>
                  {isPlaying && (
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.5 }}
                      className="absolute inset-0 mix-blend-overlay dark:mix-blend-screen"
                      style={{ filter: 'blur(30px)' }}
                    >
                      {/* Red/Pink orb */}
                      <motion.div
                        animate={{
                          scale: [1, 1.2, 1],
                          x: ['-20%', '30%', '-20%'],
                          y: ['-10%', '10%', '-10%'],
                        }}
                        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                        className="absolute -top-1/2 -left-1/4 w-[150%] h-[150%] bg-[#ff2a5f] rounded-full mix-blend-screen opacity-50"
                      />
                      {/* Cyan/Blue orb */}
                      <motion.div
                        animate={{
                          scale: [1, 1.4, 1],
                          x: ['30%', '-30%', '30%'],
                          y: ['10%', '-10%', '10%'],
                        }}
                        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                        className="absolute -bottom-1/2 -right-1/4 w-[150%] h-[150%] bg-[#00f0ff] rounded-full mix-blend-screen opacity-50"
                      />
                      {/* Purple orb */}
                      <motion.div
                        animate={{
                          scale: [1, 1.3, 1],
                          x: ['0%', '20%', '0%'],
                          y: ['20%', '-20%', '20%'],
                        }}
                        transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 2 }}
                        className="absolute top-1/4 left-1/4 w-[120%] h-[120%] bg-[#8a2be2] rounded-full mix-blend-screen opacity-50"
                      />
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Material overlay - adapts to light/dark mode */}
                <div className="absolute inset-0 bg-white/40 dark:bg-black/40 backdrop-blur-[40px]" />
                
                {/* Edge glow when playing (Siri 18 style) */}
                <AnimatePresence>
                   {isPlaying && (
                     <motion.div
                       initial={{ opacity: 0 }}
                       animate={{ opacity: 1 }}
                       exit={{ opacity: 0 }}
                       className="absolute inset-0 rounded-[20px] border-[1.5px] border-transparent"
                       style={{
                         background: 'linear-gradient(45deg, rgba(255,42,95,0.4), rgba(0,240,255,0.4), rgba(138,43,226,0.4)) border-box',
                         WebkitMask: 'linear-gradient(#fff 0 0) padding-box, linear-gradient(#fff 0 0)',
                         WebkitMaskComposite: 'xor',
                         maskComposite: 'exclude'
                       }}
                     />
                   )}
                </AnimatePresence>
              </div>

              {/* Inner Content */}
              <div className="relative z-10 p-2.5 flex items-center gap-3">
                
                {/* Artwork */}
                <motion.div layoutId="player-artwork" className="w-12 h-12 rounded-[12px] overflow-hidden shadow-md flex-shrink-0 relative bg-gray-200 dark:bg-gray-800">
                  {currentTrack.image ? (
                    <OfflineImage localPath={currentTrack.localCoverPath || currentTrack.original?.localCoverPath} remoteUrl={getImageSrc(currentTrack.album?.image || currentTrack.image)} alt={currentTrack.title} className="w-full h-full object-cover" onError={(e) => { e.currentTarget.src = 'https://placehold.co/400x400/1C1C1E/FFFFFF/png?text = Audio' }} />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-black/10 dark:bg-white/10 text-gray-500">?</div>
                  )}
                  {/* Playing indicator overlay on image (optional subtlety) */}
                  {isPlaying && (
                    <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="flex gap-[2px] justify-center h-3 items-end">
                        <div className="w-0.5 bg-white animate-[bounce_1s_infinite] h-1.5"></div>
                        <div className="w-0.5 bg-white animate-[bounce_1s_infinite_0.2s] h-3"></div>
                        <div className="w-0.5 bg-white animate-[bounce_1s_infinite_0.4s] h-2"></div>
                      </div>
                    </div>
                  )}
                </motion.div>
                {/* Track Info */}
                <div className="flex-1 min-w-0 flex flex-col justify-center">
                  <p className="text-[15px] font-bold leading-tight truncate text-black dark:text-white mb-0.5">
                    {currentTrack.title}
                  </p>
                  <div className="flex items-center gap-1.5">
                    {currentTrack.hires && (
                      <span className="bg-[#FFB800]/20 text-[#FFB800] dark:text-[#FFB800] text-[8px] font-black tracking-widest px-1 py-0.5 rounded uppercase border border-[#FFB800]/30 shrink-0 leading-none mt-0.5">
                        HI-RES
                      </span>
                    )}
                    <p className="text-[13px] font-medium text-black/60 dark:text-white/60 leading-tight truncate">
                      {currentTrack.artist}
                    </p>
                  </div>
                </div>

                {/* Controls */}
                <div className="flex items-center gap-2 pr-2">
                  <button 
                    onClick={togglePlay} 
                    className="w-10 h-10 flex items-center justify-center text-black dark:text-white hover:scale-110 active:scale-95 transition-all bg-black/5 dark:bg-white/10 rounded-full"
                  >
                    {isLoading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : isPlaying ? (
                      <Pause className="w-5 h-5 fill-current" />
                    ) : (
                      <Play className="w-5 h-5 fill-current ml-0.5" />
                    )}
                  </button>
                </div>
              </div>
              
              {/* Premium sleek progress bar */}
              <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-black/10 dark:bg-white/10">
                <div 
                  ref={progressRef}
                  className="h-full bg-black dark:bg-white shadow-[0_0_8px_rgba(0,0,0,0.5)] dark:shadow-[0_0_8px_rgba(255,255,255,0.5)] rounded-r-full"
                  style={{ width: '0%' }}
                />
              </div>

            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      <ExpandedPlayer />
    </>
  );
}
