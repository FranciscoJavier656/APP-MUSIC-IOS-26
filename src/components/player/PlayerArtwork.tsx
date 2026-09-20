import React, { useRef, useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { usePlayer } from '../PlayerContext';
import { Capacitor, registerPlugin } from '@capacitor/core';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { QobuzAudio } from '../../lib/QobuzAudioPlugin';
import { getImageSrc } from '../../lib/image';

const YagamiNative = registerPlugin('YagamiDownloadManager');

interface PlayerArtworkProps {
  dominantColor: string | null;
  setDominantColor: (color: string | null) => void;
}

type LyricLine = { time: number; text: string; duration: number };

export default function PlayerArtwork({ dominantColor, setDominantColor }: PlayerArtworkProps) {
  const { currentTrack, isPlaying, audioRef, isExpanded, seekTo } = usePlayer();
  
  const [resolvedImageSrc, setResolvedImageSrc] = useState<string | undefined>();
  const [showLyrics, setShowLyrics] = useState(false);
  const [lyrics, setLyrics] = useState<string>("Cargando letras...");
  const [parsedLyrics, setParsedLyrics] = useState<LyricLine[] | null>(null);
  
  const parsedLyricsRef = useRef<LyricLine[] | null>(null);
  const activeLyricIndexRef = useRef<number>(-1);
  const lyricsContainerRef = useRef<HTMLDivElement>(null);
  const lyricsBgRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dominantColorRef = useRef<string | null>(null);
  const isPlayingRef = useRef(isPlaying);
  const lastFetchedTrackRef = useRef<string | null>(null);
  
  const isManualScrollingRef = useRef(false);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const touchStartYRef = useRef(0);
  const touchStartScrollYRef = useRef(0);
  const currentScrollYRef = useRef(0);

  const handleTouchStart = (e: React.TouchEvent) => {
      isManualScrollingRef.current = true;
      touchStartYRef.current = e.touches[0].clientY;
      touchStartScrollYRef.current = currentScrollYRef.current;
      if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
      e.stopPropagation();
      const deltaY = e.touches[0].clientY - touchStartYRef.current;
      currentScrollYRef.current = touchStartScrollYRef.current - deltaY;
      
      if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
      scrollTimeoutRef.current = setTimeout(() => {
          isManualScrollingRef.current = false;
      }, 3000);
  };

  const handleTouchEnd = () => {
      if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
      scrollTimeoutRef.current = setTimeout(() => {
          isManualScrollingRef.current = false;
      }, 3000);
  };

  useEffect(() => {
    dominantColorRef.current = dominantColor;
  }, [dominantColor]);

  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  // Invalidate cached layout positions when lyrics view toggles or lyrics change
  useEffect(() => {
    const invalidateCache = () => {
      if (lyricsContainerRef.current) {
        const children = lyricsContainerRef.current.children;
        for (let i = 0; i < children.length; i++) {
          (children[i] as any)._cachedCenterY = undefined;
        }
      }
    };
    
    // Invalidate immediately and after flip animation settles
    invalidateCache();
    const t1 = setTimeout(invalidateCache, 150);
    const t2 = setTimeout(invalidateCache, 500);
    const t3 = setTimeout(invalidateCache, 1100);
    
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [showLyrics, parsedLyrics]);

  // Resolve Image SRC
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

  // Extract Color
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
          return;
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
            const sampleSize = 32; 
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
      }
    } else {
      setDominantColor(null);
    }
  }, [resolvedImageSrc, setDominantColor]);

  // Fetch Lyrics
  useEffect(() => {
    setShowLyrics(false);
  }, [currentTrack?.id || currentTrack?.title]);

  useEffect(() => {
    if (currentTrack && showLyrics) {
      const trackId = currentTrack.id || currentTrack.title;
      if (lastFetchedTrackRef.current === trackId && parsedLyricsRef.current) {
        return; // Already fetched
      }
      lastFetchedTrackRef.current = trackId;

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
                const match = line.match(/\[(\d{2,}):(\d{2})\.(\d{1,3})\](.*)/);
                if (match) {
                  const minutes = parseInt(match[1], 10);
                  const seconds = parseInt(match[2], 10);
                  const msStr = match[3];
                  let ms = parseInt(msStr, 10);
                  if (msStr.length === 1) ms *= 100;
                  else if (msStr.length === 2) ms *= 10;
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

  // FFT listener
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

  // Animation Loop (Lyrics & Canvas)
  useEffect(() => {
    let animationId: number;
    let timeoutId: number;
    let isActive = true;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
        
    let lastNativeTime = -1;
    let interpolatedTime = 0;
    let lastUpdateTimestamp = performance.now();

    const startDrawing = () => {
      const draw = () => {
        if (!isActive) return;
        
        // Sync lyrics
        if (audioRef.current && parsedLyricsRef.current && lyricsContainerRef.current) {
          const rawNative = (audioRef.current as any).nativeCurrentTime;
          if (rawNative !== undefined) {
             const now = performance.now();
             const delta = (now - lastUpdateTimestamp) / 1000;
             if (rawNative !== lastNativeTime) {
                 if (lastNativeTime === -1 || Math.abs(rawNative - lastNativeTime) > 1.5) {
                     interpolatedTime = rawNative;
                 } else {
                     interpolatedTime += delta;
                     if (rawNative > interpolatedTime) {
                         interpolatedTime = (interpolatedTime * 0.8) + (rawNative * 0.2);
                     }
                 }
                 lastNativeTime = rawNative;
                 lastUpdateTimestamp = now;
             } else if (isPlayingRef.current) {
                 interpolatedTime += delta;
                 lastUpdateTimestamp = now;
             } else {
                 lastUpdateTimestamp = now;
             }
          } else {
             interpolatedTime = audioRef.current.currentTime;
          }

          const current = interpolatedTime;
          const lyricsArray = parsedLyricsRef.current;
          const LYRICS_OFFSET = 0.0;
          const adjustedCurrent = current + LYRICS_OFFSET;
          let activeIdx = -1;
          
          for (let i = 0; i < lyricsArray.length; i++) {
              if (adjustedCurrent >= lyricsArray[i].time) {
                  activeIdx = i;
              } else {
                  break;
              }
          }
          
          activeLyricIndexRef.current = activeIdx;
          
          const container = lyricsContainerRef.current;
          const children = container.children;
          const parentContainer = container.parentElement;
          if (!parentContainer) return;

          // 0. Pre-cache all layout properties to prevent Layout Thrashing
          for (let i = 0; i < children.length; i++) {
              const child = children[i] as HTMLElement;
              if ((child as any)._cachedCenterY === undefined) {
                  (child as any)._cachedCenterY = child.offsetTop + (child.clientHeight / 2);
              }
          }
          
          // 1. Calculate Target Y
          let targetY = currentScrollYRef.current;
          if (activeIdx >= 0 && activeIdx < children.length) {
              const activeChild = children[activeIdx] as HTMLElement;
              targetY = (activeChild as any)._cachedCenterY;
          } else if (children.length > 0) {
              const firstChild = children[0] as HTMLElement;
              targetY = (firstChild as any)._cachedCenterY - 50; 
          }
          
          // 2. Apply LERP for scroll
          if (!isManualScrollingRef.current) {
              if (Math.abs(targetY - currentScrollYRef.current) > 350) {
                  currentScrollYRef.current = targetY; // Snap if distance is too large (e.g. flip or seek)
              } else {
                  currentScrollYRef.current += (targetY - currentScrollYRef.current) * 0.12; // Smoother and faster LERP
              }
          }

          const containerCenter = parentContainer.clientHeight / 2;
          const globalTranslateY = containerCenter - currentScrollYRef.current;

          // 3. Update all children with 3D Wheel effect
          const visibleThreshold = parentContainer.clientHeight * 0.8;

          for (let i = 0; i < children.length; i++) {
              const child = children[i] as HTMLElement;
              
              const childCenterY = (child as any)._cachedCenterY;
              const distanceFromCenter = childCenterY - currentScrollYRef.current;
              const distanceAbs = Math.abs(distanceFromCenter);

              if (distanceAbs > visibleThreshold && i !== activeIdx) {
                  if ((child as any)._isHidden !== true || child.style.opacity !== '0') {
                      child.style.opacity = '0';
                      (child as any)._isHidden = true;
                  }
                  continue;
              }
              (child as any)._isHidden = false;
              child.style.transformOrigin = '50% 50%';
              
              // 3D Math based on screen position
              const normalizedDistance = distanceFromCenter / 80;
              const rotateX = Math.max(-75, Math.min(75, normalizedDistance * 25)); // Rotate up to 75 deg
              const translateZ = -Math.abs(normalizedDistance) * 20; 
              
              const blurAmount = Math.min(10, distanceAbs * 0.025);
              const scaleAmount = Math.max(0.75, 1.05 - (distanceAbs * 0.001));
              const opacityAmount = Math.max(0.05, 1 - (distanceAbs * 0.004));
              
              const isActiveNode = (i === activeIdx);

              if (isActiveNode) {
                  if (!(child as any)._wasActive) {
                      child.classList.add('lyric-active');
                      (child as any)._wasActive = true;
                  }
                  child.style.opacity = '1';
                  child.style.transform = `translateY(${globalTranslateY}px) scale(1.15) rotateX(${rotateX}deg) translateZ(20px)`;
                  child.style.filter = 'blur(0px)';
                  child.style.textShadow = '0 0 30px rgba(255,255,255,0.6)';
                  child.style.color = '#ffffff';
                  
                  const activeLine = lyricsArray[i];
                  let percent = ((adjustedCurrent - activeLine.time) / activeLine.duration);
                  if (percent < 0) percent = 0;
                  if (percent > 1) percent = 1;
                  
                  const easeOutPercent = 1 - Math.pow(1 - percent, 3);
                  
                  // Cache words array on the DOM node to avoid querySelectorAll
                  let words = (child as any)._cachedWords;
                  if (!words) {
                      words = child.querySelectorAll('.word');
                      (child as any)._cachedWords = words;
                  }
                  
                  if (words && words.length > 0) {
                      const totalWords = words.length;
                      words.forEach((wordSpan: any, wIdx: number) => {
                          const wordStart = wIdx / totalWords;
                          const wordEnd = (wIdx + 1) / totalWords;
                          const htmlWord = wordSpan as HTMLElement;
                          
                          if (easeOutPercent >= wordEnd) {
                              htmlWord.style.background = 'none';
                              htmlWord.style.color = '#ffffff';
                              htmlWord.style.WebkitTextFillColor = 'initial';
                              htmlWord.style.textShadow = '0 0 20px rgba(255,255,255,0.5)';
                          } else if (easeOutPercent <= wordStart) {
                              htmlWord.style.background = 'none';
                              htmlWord.style.color = 'rgba(255,255,255,0.3)';
                              htmlWord.style.WebkitTextFillColor = 'initial';
                              htmlWord.style.textShadow = 'none';
                          } else {
                              const wordPct = ((easeOutPercent - wordStart) / (wordEnd - wordStart)) * 100;
                              htmlWord.style.background = `linear-gradient(to right, #ffffff ${wordPct}%, rgba(255,255,255,0.3) ${wordPct}%)`;
                              htmlWord.style.WebkitBackgroundClip = 'text';
                              htmlWord.style.WebkitTextFillColor = 'transparent';
                              htmlWord.style.backgroundClip = 'text';
                              htmlWord.style.textShadow = '0 0 15px rgba(255,255,255,0.4)';
                          }
                      });
                  }
              } else {
                  if ((child as any)._wasActive) {
                      child.classList.remove('lyric-active');
                      (child as any)._wasActive = false;
                      
                      child.style.background = 'none';
                      child.style.WebkitBackgroundClip = 'initial';
                      child.style.WebkitTextFillColor = 'initial';
                      child.style.backgroundClip = 'initial';
                      child.style.color = 'rgba(255,255,255,0.4)';
                      
                      let words = (child as any)._cachedWords;
                      if (!words) {
                          words = child.querySelectorAll('.word');
                          (child as any)._cachedWords = words;
                      }
                      
                      if (words) {
                          words.forEach((w: any) => {
                              const htmlWord = w as HTMLElement;
                              htmlWord.style.background = 'none';
                              htmlWord.style.WebkitBackgroundClip = 'initial';
                              htmlWord.style.WebkitTextFillColor = 'initial';
                              htmlWord.style.backgroundClip = 'initial';
                              htmlWord.style.color = 'inherit';
                              htmlWord.style.textShadow = 'none';
                          });
                      }
                  }

                  child.style.opacity = opacityAmount.toString();
                  child.style.transform = `translateY(${globalTranslateY}px) scale(${scaleAmount}) rotateX(${rotateX}deg) translateZ(${translateZ}px)`;
                  child.style.filter = `blur(${blurAmount}px)`;
                  child.style.textShadow = 'none';
              }
          }
        }

        // Draw Analyser
        if (ctx && canvas && (canvas as any).nativeFftData) {
          const rawDataArray = (canvas as any).nativeFftData;
          const bufferLength = rawDataArray.length;
          
          if (!(canvas as any).smoothedFftData) {
             (canvas as any).smoothedFftData = new Float32Array(bufferLength);
          }
          const smoothed = (canvas as any).smoothedFftData;
          
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          
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
            const targetValue = isPlayingRef.current ? rawDataArray[i] : 0;
            smoothed[i] = smoothed[i] * 0.70 + targetValue * 0.30;
            
            let barHeight = (smoothed[i] / 255) * canvas.height;
            if (barHeight < 3) barHeight = 3; 
            
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
          
          // Audio Reactive Background
          let bassSum = 0;
          const bassCount = Math.min(5, bufferLength);
          for(let i=0; i<bassCount; i++) bassSum += rawDataArray[i] || 0;
          const bassAvg = bassCount > 0 ? (bassSum / bassCount) : 0;
          const bassImpact = isPlayingRef.current ? (bassAvg / 255) : 0;
          
          if (!(window as any).bgSmoothed) (window as any).bgSmoothed = 0;
          (window as any).bgSmoothed = (window as any).bgSmoothed * 0.8 + bassImpact * 0.2;
          
          if (lyricsBgRef.current) {
             const scale = 1.1 + ((window as any).bgSmoothed * 0.05); 
             const opacity = 0.65 + ((window as any).bgSmoothed * 0.35); 
             lyricsBgRef.current.style.transform = `scale(${scale})`;
             lyricsBgRef.current.style.opacity = `${opacity}`;
          }
          
          // Audio Glow
          let midSum = 0;
          const midStart = Math.floor(bufferLength * 0.1);
          const midEnd = Math.floor(bufferLength * 0.4);
          const midCount = Math.max(1, midEnd - midStart);
          for (let i = midStart; i < midEnd; i++) midSum += rawDataArray[i] || 0;
          const midAvg = midSum / midCount;
          
          if (!(window as any).baselineMid) (window as any).baselineMid = midAvg;
          (window as any).baselineMid = (window as any).baselineMid * 0.95 + midAvg * 0.05; 
          
          const spike = Math.max(0, midAvg - (window as any).baselineMid);
          const midImpact = isPlayingRef.current ? Math.min((spike / 20), 1.5) : 0;
          
          if (!(window as any).midSmoothed) (window as any).midSmoothed = 0;
          if (midImpact > (window as any).midSmoothed) {
              (window as any).midSmoothed = (window as any).midSmoothed * 0.4 + midImpact * 0.6; 
          } else {
              (window as any).midSmoothed = (window as any).midSmoothed * 0.93 + midImpact * 0.07; 
          }
          
          const titleEl = document.getElementById('player-title');
          const playBtnEl = document.getElementById('player-play-button');
          const bgGlowEl = document.getElementById('player-bg-glow');
          
          if (titleEl) titleEl.style.textShadow = 'none';
          if (playBtnEl) playBtnEl.style.boxShadow = '0 10px 15px -3px rgba(0,0,0,0.3)';
          
          if (bgGlowEl) {
             const baseOpacity = isDarkMode ? 0.45 : 0.35;
             bgGlowEl.style.opacity = baseOpacity.toString();
             
             if (!(window as any).auraSize) (window as any).auraSize = 0;
             if (midImpact > (window as any).auraSize) {
                 (window as any).auraSize = (window as any).auraSize * 0.85 + midImpact * 0.15; 
             } else {
                 (window as any).auraSize = (window as any).auraSize * 0.95 + midImpact * 0.05; 
             }
             const aura = (window as any).auraSize;
             const dynamicScale = Math.min(aura * 0.6, 0.6); 
             
             bgGlowEl.style.transform = `scale(${1 + dynamicScale})`;
             bgGlowEl.style.filter = 'saturate(1.8) brightness(1.25)';
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
         // Draw once to update to paused state
         draw();
      }
    };

    const handleVisibilityChange = () => {
       if (document.visibilityState === 'visible') {
           lastUpdateTimestamp = performance.now();
           if (isPlaying && isExpanded) {
               startDrawing();
           }
       }
    };

    const handleResize = () => {
      if (lyricsContainerRef.current) {
        const children = lyricsContainerRef.current.children;
        for (let i = 0; i < children.length; i++) {
          (children[i] as any)._cachedCenterY = undefined;
        }
      }
    };
    
    window.addEventListener('resize', handleResize);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    if (isExpanded) {
      timeoutId = window.setTimeout(startDrawing, 100);
    }
    return () => {
      isActive = false;
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      clearTimeout(timeoutId);
      if (animationId) cancelAnimationFrame(animationId);
    };
  }, [audioRef, isExpanded, isPlaying]);

  if (!currentTrack) return null;

  return (
    <>
      <div className="flex-1 flex flex-col items-center justify-center min-h-0 relative z-10 w-full" style={{ perspective: '2000px' }}>
        <motion.div 
          layoutId="player-artwork"
          className="relative aspect-square rounded-3xl shadow-[0_35px_60px_-15px_rgba(0,0,0,1),0_20px_30px_-5px_rgba(0,0,0,0.8)] cursor-pointer"
          style={{ 
            width: 'min(100%, 50vh, 400px)',
            height: 'min(100%, 50vh, 400px)',
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
          <div onClick={() => setShowLyrics(true)} className="absolute inset-0 rounded-3xl overflow-hidden shadow-inner cursor-pointer" style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden', pointerEvents: showLyrics ? 'none' : 'auto', transform: 'translateZ(1px)' }}>
            <img
              src={resolvedImageSrc || getImageSrc(currentTrack?.album?.image || currentTrack?.image || currentTrack?.original?.album?.image || currentTrack?.original?.image)}
              alt={currentTrack.albumTitle || "Album Cover"}
              className={`w-full h-full object-cover transition-transform duration-1000 ease-[cubic-bezier(0.19,1,0.22,1)] ${isPlaying && !showLyrics ? 'scale-105' : 'scale-100'}`}
            />
          </div>
          
          {/* Back (Lyrics) */}
          <div 
            onClick={() => setShowLyrics(false)}
            className="absolute inset-0 rounded-3xl overflow-hidden border border-white/20 bg-black cursor-pointer"
            style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden', transform: 'rotateY(180deg) translateZ(1px)', pointerEvents: showLyrics ? 'auto' : 'none' }}
          >
            {/* Yagami Audio-Reactive Mesh Background */}
            <div className="absolute inset-0 overflow-hidden rounded-3xl bg-neutral-900">
              {/* Audio Reactive Orbs */}
              <div ref={lyricsBgRef} className="absolute inset-0 transition-opacity duration-75 mix-blend-screen opacity-70">
                <div 
                  className="absolute w-full h-[120%] top-[-10%] left-[-20%] rounded-full opacity-100 animate-[spin_15s_linear_infinite]"
                  style={{ background: dominantColor ? `radial-gradient(circle, ${dominantColor} 0%, transparent 60%)` : 'none', filter: 'blur(40px) saturate(150%)' }}
                />
                <div 
                  className="absolute w-[120%] h-full bottom-[-10%] right-[-20%] rounded-full opacity-90 animate-[spin_20s_linear_infinite_reverse]"
                  style={{ background: dominantColor ? `radial-gradient(circle, ${dominantColor} 0%, transparent 70%)` : 'none', filter: 'blur(50px) saturate(150%)' }}
                />
              </div>
              {/* Glass Overlay for readability */}
              <div className="absolute inset-0 bg-black/30 backdrop-blur-3xl rounded-3xl" />
            </div>
            
            <div className="absolute inset-0 flex flex-col p-4 bg-black/20 rounded-3xl">
                <div 
                  onTouchStart={handleTouchStart}
                  onTouchMove={handleTouchMove}
                  onTouchEnd={handleTouchEnd}
                  onTouchCancel={handleTouchEnd}
                  className="overflow-hidden flex-1 text-center cursor-default relative" 
                  style={{ 
                    maskImage: 'linear-gradient(to bottom, transparent 0%, black 25%, black 75%, transparent 100%)', 
                    WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 25%, black 75%, transparent 100%)',
                    perspective: '1200px'
                  }}
                >
                  <div className="absolute inset-0 flex flex-col items-center px-4" ref={lyricsContainerRef}>
                    {parsedLyrics ? (
                      parsedLyrics.map((line, idx) => (
                        <p 
                          key={idx} 
                          onClick={(e) => {
                             e.stopPropagation();
                             seekTo(line.time);
                             isManualScrollingRef.current = false;
                          }}
                          className="cursor-pointer hover:opacity-100 text-white/60 text-[1.75rem] leading-[1.3] font-extrabold tracking-tight mb-8 origin-center flex flex-col items-center gap-1.5 will-change-[transform,opacity]"
                          style={{ 
                            opacity: 0.3, 
                            transform: 'scale(0.95)', 
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
                      <div className="text-white/80 text-xl leading-relaxed font-semibold whitespace-pre-wrap flex-1 flex flex-col justify-center">
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

      <div className="h-16 w-full max-w-[320px] sm:max-w-[400px] mx-auto mt-4 mb-2 flex items-end">
         <canvas 
            ref={canvasRef} 
            width={300} 
            height={60} 
            className="w-full h-full"
         />
      </div>
    </>
  );
}
