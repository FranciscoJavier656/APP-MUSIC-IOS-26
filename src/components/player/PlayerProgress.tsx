import React, { useRef, useEffect } from 'react';
import { usePlayer } from '../PlayerContext';

interface PlayerProgressProps {
  dominantColor: string | null;
}

export default function PlayerProgress({ dominantColor }: PlayerProgressProps) {
  const { audioRef, duration, seekTo, isPlaying } = usePlayer();
  const containerRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const seekInputRef = useRef<HTMLInputElement>(null);
  const currentTimeRef = useRef<HTMLSpanElement>(null);
  const remainingTimeRef = useRef<HTMLSpanElement>(null);
  const isScrubbingRef = useRef(false);

  const formatTime = (secs: number) => {
    if (!secs || isNaN(secs)) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const setIsScrubbing = (val: boolean) => {
    isScrubbingRef.current = val;
    if (!containerRef.current) return;
    
    const trackBg = containerRef.current.querySelector('.track-bg');
    const trackFill = containerRef.current.querySelector('.track-fill');
    const thumb = containerRef.current.querySelector('.track-thumb');
    
    if (val) {
        trackBg?.classList.replace('h-1.5', 'h-2.5');
        trackFill?.classList.remove('transition-all', 'duration-100');
        thumb?.classList.remove('scale-0', 'group-hover:scale-100');
        thumb?.classList.add('scale-150');
    } else {
        trackBg?.classList.replace('h-2.5', 'h-1.5');
        trackFill?.classList.add('transition-all', 'duration-100');
        thumb?.classList.remove('scale-150');
        thumb?.classList.add('scale-0', 'group-hover:scale-100');
    }
  };

  useEffect(() => {
    let animationId: number;

    const startDrawing = () => {
      const draw = () => {
        if (audioRef.current) {
          const current = (audioRef.current as any).nativeCurrentTime ?? audioRef.current.currentTime;
          const dur = (audioRef.current as any).nativeDuration ?? (audioRef.current.duration || duration);
          
          if (dur > 0) {
            const percent = (current / dur) * 100;
            
            if (progressRef.current && !isScrubbingRef.current) {
              progressRef.current.style.width = `${percent}%`;
            }
            if (seekInputRef.current && !isScrubbingRef.current) {
              seekInputRef.current.value = percent.toString();
            }
            if (currentTimeRef.current && !isScrubbingRef.current) {
              currentTimeRef.current.textContent = formatTime(current);
            }
            if (remainingTimeRef.current) {
              remainingTimeRef.current.textContent = "-" + formatTime(dur - current);
            }
          }
        }
        if (isPlaying && document.visibilityState === 'visible') {
           animationId = requestAnimationFrame(draw);
        } else {
           animationId = 0;
        }
      };
      
      if (isPlaying && document.visibilityState === 'visible' && !animationId) {
         draw();
      } else if (!isPlaying || document.visibilityState !== 'visible') {
         draw();
      }
    };

    startDrawing();

    const handleVisibilityChange = () => {
        if (document.visibilityState === 'visible' && isPlaying && !animationId) {
            startDrawing();
        }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      if (animationId) cancelAnimationFrame(animationId);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [audioRef, duration, isPlaying]);

  const handleSeekChange = (e: any) => {
    setIsScrubbing(true);
    const val = parseFloat(e.target.value);
    const dur = (audioRef.current as any)?.nativeDuration ?? duration;
    const current = (val / 100) * dur;
    if (progressRef.current) progressRef.current.style.width = `${val}%`;
    if (currentTimeRef.current) currentTimeRef.current.textContent = formatTime(current);
  };

  const handleSeekCommit = (e: any) => {
    let val = parseFloat(e.target?.value);
    if (isNaN(val) && seekInputRef.current) {
        val = parseFloat(seekInputRef.current.value);
    }
    const dur = (audioRef.current as any)?.nativeDuration ?? (audioRef.current?.duration || duration);
    seekTo((val / 100) * dur);
    setTimeout(() => setIsScrubbing(false), 200);
  };

  return (
    <div ref={containerRef} className="mb-8 relative group cursor-pointer">
      <input
        type="range"
        min="0"
        max="100"
        step="0.01"
        defaultValue="0"
        ref={seekInputRef}
        onChange={handleSeekChange}
        onMouseDown={() => setIsScrubbing(true)}
        onMouseUp={handleSeekCommit}
        onTouchStart={() => setIsScrubbing(true)}
        onTouchEnd={handleSeekCommit}
        onTouchCancel={handleSeekCommit}
        className="scrubber-input absolute top-1/2 -translate-y-1/2 w-full h-10 z-20 opacity-0 cursor-pointer"
        style={{ WebkitTapHighlightColor: 'transparent' }}
      />
      <div className="track-bg relative flex items-center bg-black/10 dark:bg-white/10 rounded-full pointer-events-none transition-all duration-300 ease-out h-1.5">
        <div
          ref={progressRef}
          className="track-fill absolute top-0 left-0 h-full rounded-full pointer-events-none transition-all duration-100"
          style={{ width: '0%', backgroundColor: dominantColor || 'rgba(120, 120, 120, 0.8)' }}
        >
          <div 
            className="track-thumb absolute top-1/2 -translate-y-1/2 -right-1.5 w-3 h-3 bg-white rounded-full shadow-[0_2px_4px_rgba(0,0,0,0.3)] transition-transform duration-300 ease-out scale-0 group-hover:scale-100"
          />
        </div>
      </div>
      <div className="flex justify-between mt-3 text-[12px] font-semibold text-black/50 dark:text-white/50 tabular-nums tracking-wide">
        <span ref={currentTimeRef}>0:00</span>
        <span ref={remainingTimeRef}>-0:00</span>
      </div>
    </div>
  );
}
