import React, { useRef, useEffect } from 'react';
import { motion } from 'motion/react';
import { Play, Pause, SkipForward, SkipBack, Repeat, Shuffle } from 'lucide-react';
import { usePlayer } from '../PlayerContext';
import { Capacitor } from '@capacitor/core';
import { Haptics, ImpactStyle } from '@capacitor/haptics';

interface PlayerControlsProps {
  dominantColor: string | null;
}

export default function PlayerControls({ dominantColor }: PlayerControlsProps) {
  const { 
    isPlaying, togglePlay, nextTrack, prevTrack,
    isShuffle, toggleShuffle, repeatMode, toggleRepeat
  } = usePlayer();

  const safeHaptics = (style: ImpactStyle) => {
    try {
      if (Capacitor.isNativePlatform()) {
        Haptics.impact({ style: style }).catch(() => {});
      }
    } catch (e) {}
  };

  return (
    <div className="flex items-center justify-between px-2 sm:px-8 mb-4">
      <button
        onClick={toggleShuffle}
        className={`transition-colors p-2 ${isShuffle ? 'text-black dark:text-white' : 'text-black/30 dark:text-white/30 hover:text-black/80 dark:hover:text-white/80'}`}
      >
        <Shuffle className="w-5 h-5" />
      </button>
      <motion.button 
        whileTap={{ scale: 0.8 }}
        onClick={() => { safeHaptics(ImpactStyle.Light); prevTrack(); }}
        className="p-3 text-black dark:text-white"
      >
        <SkipBack className="w-8 h-8 fill-current" />
      </motion.button>
      <motion.button 
        id="player-play-button"
        whileTap={{ scale: 0.85 }}
        onClick={() => { safeHaptics(ImpactStyle.Medium); togglePlay(); }}
        className="w-20 h-20 flex items-center justify-center text-white rounded-full shadow-lg transition-shadow duration-75"
        style={{ 
          backgroundColor: dominantColor || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'white' : 'black'), 
          color: dominantColor ? '#fff' : (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'black' : 'white') 
        }}
      >
        <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor" style={{ marginLeft: isPlaying ? '0' : '4px' }} className="transition-all duration-300">
          <motion.path
            animate={{
              d: isPlaying 
                ? "M 6 4 L 10 4 L 10 20 L 6 20 Z" 
                : "M 5 3 L 12 7.5 L 12 16.5 L 5 21 Z"
            }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
          />
          <motion.path
            animate={{
              d: isPlaying 
                ? "M 14 4 L 18 4 L 18 20 L 14 20 Z" 
                : "M 12 7.5 L 19 12 L 19 12 L 12 16.5 Z"
            }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
          />
        </svg>
      </motion.button>
      <motion.button 
        whileTap={{ scale: 0.8 }}
        onClick={() => { safeHaptics(ImpactStyle.Light); nextTrack(); }}
        className="p-3 text-black dark:text-white"
      >
        <SkipForward className="w-8 h-8 fill-current" />
      </motion.button>
      <button
        onClick={toggleRepeat}
        className={`transition-colors p-2 relative ${repeatMode !== 'off' ? 'text-black dark:text-white' : 'text-black/30 dark:text-white/30 hover:text-black/80 dark:hover:text-white/80'}`}
      >
        <Repeat className="w-5 h-5" />
        {repeatMode === 'one' && (
          <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[9px] font-bold">1</span>
        )}
      </button>
    </div>
  );
}
