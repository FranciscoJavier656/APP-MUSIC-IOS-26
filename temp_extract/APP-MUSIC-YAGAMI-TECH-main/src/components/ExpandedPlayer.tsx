import { motion, AnimatePresence } from 'motion/react';
import React, { useRef, useEffect, useState } from 'react';
import { ChevronDown, Play, Pause, SkipForward, SkipBack, Repeat, Shuffle, ListMusic, Info, MoreHorizontal, Download } from 'lucide-react';
import { usePlayer } from './PlayerContext';
import { QobuzAudio } from '../lib/QobuzAudioPlugin';
import { Capacitor, registerPlugin } from '@capacitor/core';
const YagamiNative = registerPlugin('YagamiDownloadManager');
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { getImageSrc } from '../lib/image';
import { OfflineImage } from './OfflineImage';


export default function ExpandedPlayer() {
    const safeHaptics = (style: ImpactStyle) => {
    try {
      if (Capacitor.isNativePlatform()) {
        Haptics.impact({ style: style }).catch(() => {});
      }
    } catch (e) {}
  };

  const { 
    currentTrack, isPlaying, togglePlay, playTrack, 
    duration, isExpanded, setIsExpanded,
    seekTo, nextTrack, prevTrack,
    isShuffle, toggleShuffle, repeatMode, toggleRepeat,
    audioRef, queue, setContextMenuTrack, setDownloadItem
  } = usePlayer();

  const containerRef = useRef<HTMLDivElement>(null);
  const isScrubbingRef = useRef(false);
  const isPlayingRef = useRef(isPlaying);
  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  const setIsScrubbing = (val: boolean) => {
    isScrubbingRef.current = val;
    if (!containerRef.current) return;
    
    // Direct DOM manipulation to avoid React re-renders breaking native iOS range sliders
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

  const progressRef = useRef<HTMLDivElement>(null);
  const seekInputRef = useRef<HTMLInputElement>(null);
  const currentTimeRef = useRef<HTMLSpanElement>(null);
  const remainingTimeRef = useRef<HTMLSpanElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [dominantColor, _setDominantColor] = useState<string | null>(null);
  const dominantColorRef = useRef<string | null>(null);
  const setDominantColor = (color: string | null) => {
    dominantColorRef.current = color;
    _setDominantColor(color);
  };
  const [showLyrics, setShowLyrics] = useState(false);
  const [showMetadata, setShowMetadata] = useState(false);
  const [showQueue, setShowQueue] = useState(false);
  const [lyrics, setLyrics] = useState<string>("Cargando letras...");
  type LyricLine = { time: number; text: string; duration: number };
  const [parsedLyrics, setParsedLyrics] = useState<LyricLine[] | null>(null);
  const parsedLyricsRef = useRef<LyricLine[] | null>(null);
  const activeLyricIndexRef = useRef<number>(-1);
  const lyricsContainerRef = useRef<HTMLDivElement>(null);
  const lyricsBgRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const bgGlowRef = useRef<HTMLDivElement>(null);
  const playButtonRef = useRef<HTMLButtonElement>(null);
  
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

  // Sync FFT data
  useEffect(() => {
    let listener: any;
    const setup = async () => {
      
      if (Capacitor.isNativePlatform()) {
        listener = await QobuzAudio.addListener('onFftData', (info) => {
         if (canvasRef.current && info.data) {
            (canvasRef.current as any).nativeFftData = info.data;
         }
      });
      } else {
        const webListener = (e: any) => {
          if (canvasRef.current && e.detail.data) {
             (canvasRef.current as any).nativeFftData = e.detail.data;
          }
        };
        window.addEventListener('fft_data', webListener);
        listener = { remove: () => window.removeEventListener('fft_data', webListener) };
      }

    };
    setup();
    return () => { if (listener) listener.remove(); };
  }, []);

  // Main rendering loop for Progress and FFT
  useEffect(() => {
    let animationId: number;
    let timeoutId: number;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
        
    const startDrawing = () => {
      const draw = () => {
        // 1. Update Progress UI
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
          
          // 1.5 Update Synced Lyrics
          if (parsedLyricsRef.current && lyricsContainerRef.current) {
            const lyricsArray = parsedLyricsRef.current;
            const LYRICS_OFFSET = 0.4; // advance lyrics by 400ms
            const adjustedCurrent = current + LYRICS_OFFSET;
            let activeIdx = -1;
            for (let i = 0; i < lyricsArray.length; i++) {
                if (adjustedCurrent >= lyricsArray[i].time) {
                    activeIdx = i;
                } else {
                    break;
                }
            }
            
            if (activeIdx !== activeLyricIndexRef.current) {
                activeLyricIndexRef.current = activeIdx;
                const container = lyricsContainerRef.current;
                const children = container.children;
                for (let i = 0; i < children.length; i++) {
                    const child = children[i] as HTMLElement;
                    const distance = Math.abs(i - activeIdx);
                    
                    if (i === activeIdx) {
                        child.style.opacity = '1';
                        child.style.transform = 'scale(1.15)';
                        child.style.filter = 'blur(0px)';
                        child.style.textShadow = '0 0 20px rgba(255,255,255,0.4)';
                        child.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    } else {
                        // Reset fill styles for inactive lines
                        child.style.background = 'none';
                        child.style.WebkitBackgroundClip = 'initial';
                        child.style.WebkitTextFillColor = 'initial';
                        child.style.backgroundClip = 'initial';
                        child.style.color = 'rgba(255,255,255,0.5)';
                        
                        const words = child.querySelectorAll('.word');
                        words.forEach(w => {
                            const htmlWord = w;
                            htmlWord.style.background = 'none';
                            htmlWord.style.WebkitBackgroundClip = 'initial';
                            htmlWord.style.WebkitTextFillColor = 'initial';
                            htmlWord.style.backgroundClip = 'initial';
                            htmlWord.style.color = 'inherit';
                            htmlWord.style.textShadow = 'none';
                        });

                        // Calculate cinematic blur and fade
                        const blurAmount = Math.min(distance * 1.5, 6);
                        const opacityAmount = Math.max(0.6 - (distance * 0.15), 0.1);
                        const scaleAmount = Math.max(0.95 - (distance * 0.02), 0.85);
                        
                        child.style.opacity = opacityAmount.toString();
                        child.style.transform = `scale(${scaleAmount})`;
                        child.style.filter = `blur(${blurAmount}px)`;
                        child.style.textShadow = 'none';
                    }
                }
            }
            
            // Always update fill on active line
            if (activeIdx >= 0 && activeIdx < lyricsArray.length) {
                const activeLine = lyricsArray[activeIdx];
                const activeChild = lyricsContainerRef.current.children[activeIdx];
                if (activeChild) {
                    let percent = ((adjustedCurrent - activeLine.time) / activeLine.duration);
                    if (percent < 0) percent = 0;
                    if (percent > 1) percent = 1;
                    
                    const words = activeChild.querySelectorAll('.word');
                    if (words.length > 0) {
                        const totalWords = words.length;
                        words.forEach((wordSpan, wIdx) => {
                            const wordStart = wIdx / totalWords;
                            const wordEnd = (wIdx + 1) / totalWords;
                            const htmlWord = wordSpan;
                            
                            if (percent >= wordEnd) {
                                htmlWord.style.background = 'none';
                                htmlWord.style.color = '#ffffff';
                                htmlWord.style.WebkitTextFillColor = 'initial';
                                htmlWord.style.textShadow = '0 0 16px rgba(255,255,255,0.4)';
                            } else if (percent <= wordStart) {
                                htmlWord.style.background = 'none';
                                htmlWord.style.color = 'rgba(255,255,255,0.3)';
                                htmlWord.style.WebkitTextFillColor = 'initial';
                                htmlWord.style.textShadow = 'none';
                            } else {
                                const wordPct = ((percent - wordStart) / (wordEnd - wordStart)) * 100;
                                htmlWord.style.background = `linear-gradient(to right, #ffffff ${wordPct}%, rgba(255,255,255,0.3) ${wordPct}%)`;
                                htmlWord.style.WebkitBackgroundClip = 'text';
                                htmlWord.style.WebkitTextFillColor = 'transparent';
                                htmlWord.style.backgroundClip = 'text';
                                htmlWord.style.textShadow = '0 0 16px rgba(255,255,255,0.2)';
                            }
                        });
                    }
                }
            }
          }
        }

        // 2. Draw Analyser (Native iOS vDSP)
        if (ctx && canvas && (canvas as any).nativeFftData) {
          const rawDataArray = (canvas as any).nativeFftData;
          const bufferLength = rawDataArray.length;
          
          if (!(canvas as any).smoothedFftData) {
             (canvas as any).smoothedFftData = new Float32Array(bufferLength);
          }
          const smoothed = (canvas as any).smoothedFftData;
          
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          
          // Slight padding between bars
          const barWidth = (canvas.width / bufferLength);
          let x = 0;
          
          const isDarkMode = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
          let r = isDarkMode ? 255 : 0;
          let g = isDarkMode ? 255 : 0;
          let b = isDarkMode ? 255 : 0;
          
          if (dominantColorRef.current) {
            const match = dominantColorRef.current.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
            if (match) {
              r = parseInt(match[1]);
              g = parseInt(match[2]);
              b = parseInt(match[3]);
            }
          }
          const baseRgb = `${r}, ${g}, ${b}`;
          
          for (let i = 0; i < bufferLength; i++) {
            // If paused, force the target value to 0 so it decays smoothly
            const targetValue = isPlayingRef.current ? rawDataArray[i] : 0;
            
            // Exponential smoothing for buttery smooth animation
            smoothed[i] = smoothed[i] * 0.70 + targetValue * 0.30;
            
            let barHeight = (smoothed[i] / 255) * canvas.height;
            if (barHeight < 3) barHeight = 3; // Minimum height for silence
            
            ctx.fillStyle = `rgba(${baseRgb}, ${0.15 + (smoothed[i]/255)*0.85})`; 
            ctx.beginPath();
            if (ctx.roundRect) {
              ctx.roundRect(x, canvas.height - barHeight, barWidth - 2, barHeight, [4, 4, 0, 0]);
            } else {
              ctx.fillRect(x, canvas.height - barHeight, barWidth - 2, barHeight);
            }
            ctx.fill();
            x += barWidth;
          }
          
          // 2.5 Audio Reactive Background (Cristal Vivo)
          let bassSum = 0;
          const bassCount = Math.min(5, bufferLength);
          for(let i=0; i<bassCount; i++) {
             bassSum += rawDataArray[i] || 0;
          }
          const bassAvg = bassCount > 0 ? (bassSum / bassCount) : 0;
          const bassImpact = isPlayingRef.current ? (bassAvg / 255) : 0;
          
          if (!(window as any).bgSmoothed) (window as any).bgSmoothed = 0;
          (window as any).bgSmoothed = (window as any).bgSmoothed * 0.8 + bassImpact * 0.2;
          
          if (lyricsBgRef.current) {
             const scale = 1.1 + ((window as any).bgSmoothed * 0.05); // Subtle scale bounce
             const opacity = 0.4 + ((window as any).bgSmoothed * 0.4); // Brighten on beat
             lyricsBgRef.current.style.transform = `scale(${scale})`;
             lyricsBgRef.current.style.opacity = `${opacity}`;
          }
          
          // 2.6 Audio Glow (Tipografía y Controles Radiactivos)
          let midSum = 0;
          const midStart = Math.floor(bufferLength * 0.1);
          const midEnd = Math.floor(bufferLength * 0.4);
          const midCount = Math.max(1, midEnd - midStart);
          for (let i = midStart; i < midEnd; i++) {
             midSum += rawDataArray[i] || 0;
          }
          const midAvg = midSum / midCount;
          // Prevent "stuck" glow by calculating the audio spike relative to a moving baseline
          if (!(window as any).baselineMid) (window as any).baselineMid = midAvg;
          (window as any).baselineMid = (window as any).baselineMid * 0.95 + midAvg * 0.05; 
          
          const spike = Math.max(0, midAvg - (window as any).baselineMid);
          // A spike of 20 out of 255 is a solid beat, normalize it to 1.5 max
          const midImpact = isPlayingRef.current ? Math.min((spike / 20), 1.5) : 0;
          
          if (!(window as any).midSmoothed) (window as any).midSmoothed = 0;
          
          // Fast attack, slow decay for a "breathing" light effect
          if (midImpact > (window as any).midSmoothed) {
              (window as any).midSmoothed = (window as any).midSmoothed * 0.4 + midImpact * 0.6; // Attack
          } else {
              (window as any).midSmoothed = (window as any).midSmoothed * 0.93 + midImpact * 0.07; // Decay
          }
          
          const glowIntensity = (window as any).midSmoothed;
          
          if (titleRef.current) titleRef.current.style.textShadow = 'none';
          if (playButtonRef.current) playButtonRef.current.style.boxShadow = '0 10px 15px -3px rgba(0,0,0,0.3)';
          
          if (bgGlowRef.current) {
             // 1. Opacidad FIJA Y PRESENTE (no se toca)
             const baseOpacity = isDarkMode ? 0.45 : 0.35;
             bgGlowRef.current.style.opacity = baseOpacity.toString();
             
             // 2. Aura Física (Expansión suave y natural)
             if (!(window as any).auraSize) (window as any).auraSize = 0;
             
             if (midImpact > (window as any).auraSize) {
                 (window as any).auraSize = (window as any).auraSize * 0.85 + midImpact * 0.15; // Smooth attack
             } else {
                 (window as any).auraSize = (window as any).auraSize * 0.95 + midImpact * 0.05; // Smooth decay
             }
             
             const aura = (window as any).auraSize;
             
             // Base scale is 1 (contained halo). It expands up to 1.6x its size when intense.
             const dynamicScale = Math.min(aura * 0.6, 0.6); 
             
             bgGlowRef.current.style.transform = `scale(${1 + dynamicScale})`;
             bgGlowRef.current.style.filter = 'saturate(1.8) brightness(1.25)';
          }
        }

        animationId = requestAnimationFrame(draw);
      };
      draw();
    };

    if (isExpanded) {
      timeoutId = window.setTimeout(startDrawing, 100);
    }
    return () => {
      clearTimeout(timeoutId);
      if (animationId) cancelAnimationFrame(animationId);
    };
  }, [audioRef, isExpanded, duration]);


  const [resolvedImageSrc, setResolvedImageSrc] = useState<string | undefined>();

  useEffect(() => {
    let mounted = true;
    const remoteUrl = getImageSrc(currentTrack?.album?.image || currentTrack?.image || currentTrack?.original?.album?.image || currentTrack?.original?.image);
    const localPath = currentTrack?.localCoverPath || currentTrack?.original?.localCoverPath;
    
    if (Capacitor.isNativePlatform() && localPath) {
      Filesystem.getUri({
        directory: Directory.Data,
        path: localPath.replace('file://', '')
      }).then(res => {
        if (mounted) setResolvedImageSrc(Capacitor.convertFileSrc(res.uri));
      }).catch(e => {
        if (mounted) setResolvedImageSrc(remoteUrl);
      });
    } else {
      setResolvedImageSrc(remoteUrl);
    }
    return () => { mounted = false; };
  }, [currentTrack]);

  useEffect(() => {
    if (resolvedImageSrc) {
      if (Capacitor.getPlatform() === 'ios') {
          YagamiNative.getVibrantColor({ url: resolvedImageSrc }).then((res: any) => {
              if (res && res.color) {
                  setDominantColor(res.color);
              }
          }).catch((err: any) => {
              console.error("Native color extraction failed, falling back to web:", err);
              extractWebColor();
          });
          return; // Skip web extraction
      }
      extractWebColor();
      
      function extractWebColor() {
          const img = new Image();
          if (resolvedImageSrc!.startsWith('http')) {
             img.crossOrigin = 'Anonymous';
          }
          img.src = resolvedImageSrc!;
          img.onload = () => {
            const canvas = document.createElement('canvas');
            const sampleSize = 32; // Extract from a 32x32 grid
            canvas.width = sampleSize;
            canvas.height = sampleSize;
            const ctx = canvas.getContext('2d');
            if (!ctx) return;
            
            ctx.drawImage(img, 0, 0, sampleSize, sampleSize);
            const data = ctx.getImageData(0, 0, sampleSize, sampleSize).data;
            
            let bestColor = null;
            let maxScore = -1;
            let avgR = 0, avgG = 0, avgB = 0;
            
            for (let i = 0; i < data.length; i += 4) {
               const r = data[i], g = data[i+1], b = data[i+2];
               avgR += r; avgG += g; avgB += b;
               
               const luma = 0.299 * r + 0.587 * g + 0.114 * b;
               const max = Math.max(r, g, b);
               const min = Math.min(r, g, b);
               const saturation = max === 0 ? 0 : (max - min) / max;
               
               if (luma > 30 && luma < 225) {
                   const score = (saturation * 200) + (luma < 128 ? luma : 255 - luma);
                   if (score > maxScore) {
                       maxScore = score;
                       bestColor = [r, g, b];
                   }
               }
            }
            
            const count = data.length / 4;
            avgR = Math.floor(avgR / count);
            avgG = Math.floor(avgG / count);
            avgB = Math.floor(avgB / count);
            
            if (bestColor) {
               setDominantColor(`rgb(${bestColor[0]}, ${bestColor[1]}, ${bestColor[2]})`);
            } else {
               const luma = 0.299 * avgR + 0.587 * avgG + 0.114 * avgB;
               if (luma < 50) {
                   avgR = Math.max(avgR, 120); 
                   avgG = Math.max(avgG, 120); 
                   avgB = Math.max(avgB, 120);
               } else if (luma > 220) {
                   avgR = Math.min(avgR, 150); 
                   avgG = Math.min(avgG, 150); 
                   avgB = Math.min(avgB, 150);
               }
               setDominantColor(`rgb(${avgR}, ${avgG}, ${avgB})`);
            }
          };
          img.onerror = () => setDominantColor(null);
      } // end function
    } else {
      setDominantColor(null);
    }
  }, [resolvedImageSrc]);


    useEffect(() => {
    setShowLyrics(false);
  }, [currentTrack?.id || currentTrack?.title]);

  useEffect(() => {
    if (currentTrack && showLyrics) {
      setLyrics("Buscando letras sincronizadas...");
      setParsedLyrics(null);
      parsedLyricsRef.current = null;
      activeLyricIndexRef.current = -1;
      
      const url = `https://lrclib.net/api/search?track_name=${encodeURIComponent(currentTrack.title)}&artist_name=${encodeURIComponent(currentTrack.artist)}`;
      
      fetch(url)
        .then(res => res.json())
        .then(data => {
          if (data && data.length > 0) {
            const bestMatch = data[0];
            if (bestMatch.syncedLyrics) {
              const lines = bestMatch.syncedLyrics.split('\n');
              const parsed: LyricLine[] = [];
              for (const line of lines) {
                const match = line.match(/\[(\d{2}):(\d{2})\.(\d{2,3})\](.*)/);
                if (match) {
                  const minutes = parseInt(match[1], 10);
                  const seconds = parseInt(match[2], 10);
                  const msStr = match[3].length === 2 ? match[3] + '0' : match[3];
                  const ms = parseInt(msStr, 10);
                  const time = minutes * 60 + seconds + ms / 1000;
                  const text = match[4].trim();
                  if (text) parsed.push({ time, text, duration: 0 });
                }
              }
              
              for (let i = 0; i < parsed.length; i++) {
                if (i < parsed.length - 1) {
                  parsed[i].duration = parsed[i+1].time - parsed[i].time;
                } else {
                  parsed[i].duration = 5; // Default for last line
                }
              }
              setParsedLyrics(parsed);

              parsedLyricsRef.current = parsed;
              setLyrics("");
            } else if (bestMatch.plainLyrics) {
              setLyrics(bestMatch.plainLyrics);
            } else {
              setLyrics("Letras no encontradas.");
            }
          } else {
            setLyrics("Letras no encontradas.");
          }
        })
        .catch(() => setLyrics("Letras no disponibles."));
    }
  }, [currentTrack, showLyrics]);

  if (!currentTrack) return null;

  const formatTime = (secs: number) => {
    if (!secs || isNaN(secs)) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

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
    // Add small delay to let native catch up before we resume automatic updates
    setTimeout(() => setIsScrubbing(false), 200);
  };

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
          ref={bgGlowRef}
          className="absolute inset-0 mix-blend-screen dark:mix-blend-lighten pointer-events-none origin-top"
          style={{ 
            background: `radial-gradient(circle at 50% 0%, ${dominantColor} 0%, transparent 80%)`,
            opacity: 0.45,
            filter: 'saturate(1.8) brightness(1.25)'
          }}
        />
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-8 relative z-10">
        <button
          onClick={() => setIsExpanded(false)}
          className="p-2 -ml-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
        >
          <ChevronDown className="w-8 h-8 text-black dark:text-white" />
        </button>
        <span className="text-[11px] font-bold tracking-[0.2em] uppercase text-black/40 dark:text-white/40">
          REPRODUCIENDO DESDE<br/>
          <span className="text-black/80 dark:text-white/80 block mt-0.5 tracking-widest text-center">Qobuz</span>
        </span>
        <div className="flex items-center gap-1 -mr-2">
          <button onClick={() => setContextMenuTrack({ item: currentTrack, type: 'track' })} className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors">
            <MoreHorizontal className="w-6 h-6 text-black dark:text-white" />
          </button>
          <button onClick={() => setShowQueue(true)} className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors">
            <ListMusic className="w-6 h-6 text-black dark:text-white" />
          </button>
        </div>
      </div>

      {/* Artwork */}
      <div className="flex-1 flex flex-col items-center justify-center min-h-0 relative z-10 w-full" style={{ perspective: '2000px' }}>
        <motion.div 
          layoutId="player-artwork"
          className="relative aspect-square rounded-3xl shadow-[0_35px_60px_-15px_rgba(0,0,0,1),0_20px_30px_-5px_rgba(0,0,0,0.8)] cursor-pointer"
          style={{ 
            width: 'min(100%, 45vh, 380px)',
            height: 'min(100%, 45vh, 380px)',
            transformStyle: 'preserve-3d'
          }}
          animate={{
            rotateY: showLyrics ? 180 : 0,
            scale: showLyrics ? 0.95 : 1
          }}
          transition={{
            duration: 1,
            ease: [0.19, 1, 0.22, 1]
          }}
        >
          {/* Front (Image) */}
          <div onClick={() => setShowLyrics(true)} className="absolute inset-0 rounded-3xl overflow-hidden shadow-inner cursor-pointer" style={{ backfaceVisibility: 'hidden', pointerEvents: showLyrics ? 'none' : 'auto' }}>
            <img
              src={resolvedImageSrc || getImageSrc(currentTrack?.album?.image || currentTrack?.image || currentTrack?.original?.album?.image || currentTrack?.original?.image)}
              alt={currentTrack.albumTitle}
              className={`w-full h-full object-cover transition-transform duration-1000 ease-[cubic-bezier(0.19,1,0.22,1)] ${isPlaying && !showLyrics ? 'scale-105' : 'scale-100'}`}
            />
          </div>
          
          {/* Back (Lyrics) */}
          <div 
            onClick={() => setShowLyrics(false)}
            className="absolute inset-0 rounded-3xl overflow-hidden border border-white/20 bg-gray-900 cursor-pointer"
            style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)', pointerEvents: showLyrics ? 'auto' : 'none' }}
          >
            {/* Blurred background using album art */}
            <div 
              ref={lyricsBgRef}
              className="absolute inset-0 opacity-40 scale-110" 
              style={{ backgroundImage: `url(${currentTrack.image})`, backgroundSize: 'cover', backgroundPosition: 'center', filter: 'blur(30px)' }}
            />
            
            <div className="absolute inset-0 flex flex-col p-6 bg-black/40">
                <div className="flex justify-center mb-2 relative z-20">
                  <span 
                    onClick={(e) => { e.stopPropagation(); setShowLyrics(false); }}
                    className="px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-xs font-bold text-white/90 tracking-widest uppercase shadow-sm cursor-pointer hover:bg-white/20 active:bg-white/30 transition-colors"
                  >
                    Volver a Portada
                  </span>
                </div>
                <div onTouchMove={(e) => e.stopPropagation()} className="overflow-y-auto flex-1 text-center cursor-default" style={{ scrollbarWidth: 'none', maskImage: 'linear-gradient(to bottom, transparent 0%, black 10%, black 90%, transparent 100%)', WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 10%, black 90%, transparent 100%)' }}>
                  <div className="flex flex-col items-center justify-center min-h-full py-20 px-4" ref={lyricsContainerRef}>
                    {parsedLyrics ? (
                      parsedLyrics.map((line, idx) => (
                        <p 
                          key={idx} 
                          className="text-white/60 text-[1.35rem] leading-[1.4] font-bold mb-7 transition-all duration-500 ease-[cubic-bezier(0.19,1,0.22,1)] origin-center flex flex-col items-center gap-1.5"
                          style={{ 
                            opacity: 0.3, 
                            transform: 'scale(0.95)', 
                            filter: 'blur(4px)',
                            background: 'none',
                            WebkitBackgroundClip: 'initial',
                            WebkitTextFillColor: 'initial',
                            backgroundClip: 'initial',
                            color: 'rgba(255,255,255,0.7)'
                          }}
                        >
                          {line.text.split('^').map((part, i) => (
                            <div key={i} className={i > 0 ? "text-[0.75em] font-medium opacity-75 mt-0.5 text-center" : "text-center"}>
                              {part.split(' ').map((word, w) => (
                                <span key={w} className="word inline-block mr-[0.25em]">{word}</span>
                              ))}
                            </div>
                          ))}
                        </p>
                      ))
                    ) : (
                      <div className="text-white/80 text-xl leading-relaxed font-semibold whitespace-pre-wrap">
                        {lyrics.split('\n').map((line, i) => (
                          <div key={i}>
                            {line.split('^').map((part, j) => (
                              <span key={j} className={j > 0 ? "block text-[0.8em] font-medium opacity-75 mt-1" : "block"}>{part}</span>
                            ))}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Audio Visualizer Canvas */}
      <div className="h-16 w-full max-w-[320px] sm:max-w-[400px] mx-auto mt-4 mb-2 flex items-end">
         <canvas 
            ref={canvasRef} 
            width={300} 
            height={60} 
            className="w-full h-full"
         />
      </div>

      {/* Track Info & Controls */}
      <div className="mt-2 mb-8 relative z-10">
        <div className="flex items-center justify-between mb-6">
          {/* Left: Title, Artist and Badge */}
          <div className="pr-4 flex-1 min-w-0">
            <h2 ref={titleRef} className="text-2xl sm:text-3xl font-bold text-black dark:text-white truncate tracking-tight transition-transform duration-75">{currentTrack.title}</h2>
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
            <button 
              onClick={(e) => { e.stopPropagation(); setContextMenuTrack({ item: currentTrack, type: 'track' }); }}
              className="w-10 h-10 flex-shrink-0 rounded-full bg-black/5 dark:bg-white/10 flex items-center justify-center text-black dark:text-white hover:bg-black/10 dark:hover:bg-white/20 transition-colors"
            >
              <MoreHorizontal className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Progress */}
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
            onMouseUp={(e) => handleSeekCommit(e)}
            onTouchStart={() => setIsScrubbing(true)}
            onTouchEnd={(e) => handleSeekCommit(e)}
            onTouchCancel={(e) => handleSeekCommit(e)}
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

        {/* Main Controls */}
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
            ref={playButtonRef}
            whileTap={{ scale: 0.85 }}
            onClick={() => { safeHaptics(ImpactStyle.Medium); togglePlay(); }}
            className="w-20 h-20 flex items-center justify-center text-white rounded-full shadow-lg"
            style={{ backgroundColor: dominantColor || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'white' : 'black'), color: dominantColor ? '#fff' : (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'black' : 'white') }}
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
      </div>
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
          <div onTouchMove={(e) => e.stopPropagation()} className="flex-1 overflow-y-auto pb-20 space-y-4">
            {queue.map((track, idx) => {
              const isPlayingQueue = currentTrack?.id === track.id;
              return (
                <div key={idx} onClick={() => playTrack(track)} className={`flex items-center gap-4 p-3 rounded-2xl cursor-pointer hover:bg-black/5 dark:hover:bg-white/10 transition-colors ${isPlayingQueue ? 'bg-black/5 dark:bg-white/10' : ''}`}>
                  <OfflineImage localPath={track.localCoverPath || track.original?.localCoverPath} remoteUrl={getImageSrc(track?.album?.image || track?.image)} alt={track.title} className="w-14 h-14 rounded-xl object-cover shadow-sm" />
                  <div className="flex-1 min-w-0">
                    <p className={`font-bold truncate ${isPlayingQueue ? 'text-black dark:text-white' : 'text-black/80 dark:text-white/80'}`}>
                      {track.title}
                    </p>
                    <p className="text-sm text-black/50 dark:text-white/50 truncate">{track.artist}</p>
                  </div>
                  {isPlayingQueue && (
                    <div className="w-4 h-4 flex items-end justify-between gap-[2px]">
                      <div className="w-[3px] bg-black dark:bg-white rounded-full animate-[bounce_1s_infinite] h-2"></div>
                      <div className="w-[3px] bg-black dark:bg-white rounded-full animate-[bounce_1s_infinite_0.2s] h-4"></div>
                      <div className="w-[3px] bg-black dark:bg-white rounded-full animate-[bounce_1s_infinite_0.4s] h-3"></div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
      </div>
      </motion.div>
      )}
    </AnimatePresence>
  );
}
