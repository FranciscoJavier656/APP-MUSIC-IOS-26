import React, { useRef, useEffect } from 'react';
import { usePlayer } from '../PlayerContext';

interface PlayerProgressProps {
  dominantColor: string | null;
}

const PlayerProgress = React.memo(function PlayerProgress({ dominantColor }: PlayerProgressProps) {
  const { audioRef, duration, seekTo, isPlaying } = usePlayer();
  const containerRef = useRef<HTMLDivElement>(null);
  const trackBgRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const thumbRef = useRef<HTMLDivElement>(null);
  const seekInputRef = useRef<HTMLInputElement>(null);
  const currentTimeRef = useRef<HTMLSpanElement>(null);
  const remainingTimeRef = useRef<HTMLSpanElement>(null);
  const isScrubbingRef = useRef(false);

  // Store duration in ref to prevent restarting the 60fps animation loop on duration updates
  const durationRef = useRef(duration);
  durationRef.current = duration;

  // Track integer seconds to throttle text formatting to 1Hz
  const lastCurrentSecRef = useRef<number>(-1);
  const lastRemSecRef = useRef<number>(-1);

  const formatTime = (secs: number) => {
    if (!secs || isNaN(secs)) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const setIsScrubbing = (val: boolean) => {
    isScrubbingRef.current = val;
    
    if (val) {
        trackBgRef.current?.classList.replace('h-1.5', 'h-2.5');
        progressRef.current?.classList.remove('transition-all', 'duration-100');
        thumbRef.current?.classList.remove('scale-0', 'group-hover:scale-100');
        thumbRef.current?.classList.add('scale-150');
    } else {
        trackBgRef.current?.classList.replace('h-2.5', 'h-1.5');
        progressRef.current?.classList.add('transition-all', 'duration-100');
        thumbRef.current?.classList.remove('scale-150');
        thumbRef.current?.classList.add('scale-0', 'group-hover:scale-100');
    }
  };

  useEffect(() => {
    let animationId: number;

    const startDrawing = () => {
      const draw = () => {
        if (audioRef.current) {
          const current = (audioRef.current as any).nativeCurrentTime ?? audioRef.current.currentTime;
          const dur = (audioRef.current as any).nativeDuration ?? (audioRef.current.duration || durationRef.current);
          
          if (dur > 0) {
            const percent = Math.min(100, Math.max(0, (current / dur) * 100));
            
            // 60fps smooth progress bar and scrubber thumb updates
            if (progressRef.current && !isScrubbingRef.current) {
              progressRef.current.style.width = `${percent}%`;
            }
            if (seekInputRef.current && !isScrubbingRef.current) {
              seekInputRef.current.value = percent.toString();
            }

            // 1Hz text formatting for currentTime and remainingTime (only mutate DOM when integer second changes)
            if (!isScrubbingRef.current) {
              const currentSec = Math.floor(current);
              if (currentSec !== lastCurrentSecRef.current) {
                lastCurrentSecRef.current = currentSec;
                if (currentTimeRef.current) {
                  currentTimeRef.current.textContent = formatTime(current);
                }
              }
            }

            const remSec = Math.floor(dur - current);
            if (remSec !== lastRemSecRef.current) {
              lastRemSecRef.current = remSec;
              if (remainingTimeRef.current) {
                remainingTimeRef.current.textContent = "-" + formatTime(Math.max(0, dur - current));
              }
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
  }, [audioRef, isPlaying]);

  const handleSeekChange = (e: any) => {
    setIsScrubbing(true);
    const val = parseFloat(e.target.value);
    const dur = (audioRef.current as any)?.nativeDuration ?? (audioRef.current?.duration || durationRef.current);
    const current = (val / 100) * dur;
    if (progressRef.current) progressRef.current.style.width = `${val}%`;
    if (currentTimeRef.current) {
      lastCurrentSecRef.current = Math.floor(current);
      currentTimeRef.current.textContent = formatTime(current);
    }
    if (remainingTimeRef.current && dur > 0) {
      lastRemSecRef.current = Math.floor(dur - current);
      remainingTimeRef.current.textContent = "-" + formatTime(Math.max(0, dur - current));
    }
  };

  const handleSeekCommit = (e: any) => {
    let val = parseFloat(e.target?.value);
    if (isNaN(val) && seekInputRef.current) {
        val = parseFloat(seekInputRef.current.value);
    }
    const dur = (audioRef.current as any)?.nativeDuration ?? (audioRef.current?.duration || durationRef.current);
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
      <div ref={trackBgRef} className="track-bg relative flex items-center bg-black/10 dark:bg-white/10 rounded-full pointer-events-none transition-all duration-300 ease-out h-1.5">
        <div
          ref={progressRef}
          className="track-fill absolute top-0 left-0 h-full rounded-full pointer-events-none transition-all duration-100"
          style={{ width: '0%', backgroundColor: dominantColor || 'rgba(120, 120, 120, 0.8)' }}
        >
          <div 
            ref={thumbRef}
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
});

export default PlayerProgress;
