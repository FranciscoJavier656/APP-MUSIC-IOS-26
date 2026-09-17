import { getQobuzTrackUrl } from "../lib/qobuz";
import React, {
  createContext,
  useContext,
  useState,
  useRef,
  useEffect,
  ReactNode,
} from "react";
import { Capacitor } from "@capacitor/core";
import { Filesystem, Directory } from "@capacitor/filesystem";
import { getImageSrc } from "../lib/image";
import { QobuzAudio } from "../lib/QobuzAudioPlugin";
import axios from "axios";


import TrackContextMenu from './TrackContextMenu';
import DownloadModal from './DownloadModal';

export interface Track {
  album?: any;
  localPath?: string;
  localCoverPath?: string;
  original?: any;
  local_path?: string;
  streamUrl?: string;
  id: string;
  title: string;
  artist: string;
  image: any;
  hires?: boolean;
  duration?: number;
  bitDepth?: number;
  samplingRate?: number;
  albumTitle?: string;
  releaseDate?: string;
  label?: string;
  composer?: string;
  copyright?: string;
}

interface PlayerContextType {
  contextMenuTrack: { item: any, type: 'album'|'track'|'playlist'|'artist' } | null;
  setContextMenuTrack: (track: { item: any, type: 'album'|'track'|'playlist'|'artist' } | null) => void;
  downloadItem: {item: any, type: 'album'|'track'|'playlist'|'artist'} | null;
  setDownloadItem: (item: {item: any, type: 'album'|'track'|'playlist'|'artist'} | null) => void;
  currentTrack: Track | null;
  isPlaying: boolean;
  isLoading: boolean;

  duration: number;
  isExpanded: boolean;
  setIsExpanded: (expanded: boolean) => void;
  playTrack: (track: Track, queue?: Track[]) => void;
  togglePlay: () => void;
  seekTo: (time: number) => void;
  setVolume: (volume: number) => void;
  volume: number;
  queue: Track[];
  nextTrack: () => void;
  prevTrack: () => void;
  isShuffle: boolean;
  toggleShuffle: () => void;
  repeatMode: "off" | "all" | "one";
  toggleRepeat: () => void;
  analyser: any;
  audioRef: React.MutableRefObject<HTMLAudioElement | null>;
}

const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

export function PlayerProvider({ children }: { children: ReactNode }) {
  const [contextMenuTrack, setContextMenuTrack] = useState<{ item: any, type: 'album'|'track'|'playlist'|'artist' } | null>(null);
  const [downloadItem, setDownloadItem] = useState<{item: any, type: 'album'|'track'|'playlist'|'artist'} | null>(null);
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [queue, setQueue] = useState<Track[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [duration, setDuration] = useState(0);
  const [isExpanded, setIsExpanded] = useState(false);
  const [volume, setVolumeState] = useState(1);

  const [isShuffle, setIsShuffle] = useState(false);
  const [repeatMode, setRepeatMode] = useState<"off" | "all" | "one">("off");

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const currentTrackRef = useRef<Track | null>(null);
  const queueRef = useRef<Track[]>([]);
  const repeatModeRef = useRef<"off" | "all" | "one">("off");
  const isShuffleRef = useRef(false);
  const playTrackRef = useRef<
    ((track: Track, newQueue?: Track[]) => void) | null
  >(null);
  const playRequestRef = useRef(0);
  const trackInitializedRef = useRef(false);

  // Keep refs in sync for event listeners
  useEffect(() => {
    currentTrackRef.current = currentTrack;
    queueRef.current = queue;
    repeatModeRef.current = repeatMode;
    isShuffleRef.current = isShuffle;
    
    if (currentTrack) {
       localStorage.setItem('player_currentTrack', JSON.stringify(currentTrack));
    }
    if (queue.length > 0) {
       localStorage.setItem('player_queue', JSON.stringify(queue));
    }
  }, [currentTrack, queue, repeatMode, isShuffle]);

  useEffect(() => {
    try {
      const savedTrack = localStorage.getItem('player_currentTrack');
      const savedQueue = localStorage.getItem('player_queue');
      if (savedTrack) setCurrentTrack(JSON.parse(savedTrack));
      if (savedQueue) setQueue(JSON.parse(savedQueue));
    } catch(e) {
      console.warn("Failed to restore player state", e);
    }
  }, []);

  useEffect(() => {
    audioRef.current = new Audio();
    const audio = audioRef.current;
    audio.crossOrigin = "anonymous";

    
    let audioCtx: any = null;
    let analyserNode: any = null;
    let animationFrameId: number;
    let sourceNode: any = null;

    if (!Capacitor.isNativePlatform()) {
      try {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        audioCtx = new AudioContextClass();
        analyserNode = audioCtx.createAnalyser();
        analyserNode.fftSize = 256;
        
        sourceNode = audioCtx.createMediaElementSource(audio);
        sourceNode.connect(analyserNode);
        analyserNode.connect(audioCtx.destination);
        
        const dataArray = new Uint8Array(analyserNode.frequencyBinCount);
        
        const dispatchFft = () => {
          if (!audio.paused && analyserNode) {
            analyserNode.getByteFrequencyData(dataArray);
            window.dispatchEvent(new CustomEvent('fft_data', { detail: { data: Array.from(dataArray) } }));
          }
          animationFrameId = requestAnimationFrame(dispatchFft);
        };
        dispatchFft();

        audio.addEventListener('play', () => {
          if (audioCtx?.state === 'suspended') {
            audioCtx.resume();
          }
        });
      } catch (e) {
        console.warn("Web Audio API FFT failed", e);
      }
    }

    const updateTime = () => {};


    const updateDuration = () => setDuration(audio.duration || 0);

    audio.addEventListener("timeupdate", updateTime);
    audio.addEventListener("loadedmetadata", updateDuration);

    let timeUpdateListener: any;
    let nativeEndListener: any;
    if (Capacitor.isNativePlatform()) {
      QobuzAudio.addListener("onTimeUpdate", (info) => {
        if (audioRef.current) {
          (audioRef.current as any).nativeCurrentTime = info.currentTime;
          (audioRef.current as any).nativeDuration = info.duration;
          setDuration(info.duration);
        }
      }).then((l) => (timeUpdateListener = l));

      QobuzAudio.addListener("onEnded", () => {
        handleTrackEnd();
      }).then((l) => (nativeEndListener = l));
    }

    const handleTrackEnd = () => {
      const mode = repeatModeRef.current;
      if (mode === "one") {
        if (Capacitor.isNativePlatform()) {
          seekTo(0);
          // togglePlay(); // handled by native or play() call if needed, wait, better to just playTrack again?
          if (playTrackRef.current && currentTrackRef.current) {
            playTrackRef.current(currentTrackRef.current);
          }
        } else {
          if (audioRef.current) audioRef.current.currentTime = 0;
          const playPromise = audioRef.current?.play();
          if (playPromise !== undefined) {
            playPromise.catch((e) => console.log("Playback interrupted:", e));
          }
        }
        return;
      }

      const q = queueRef.current;
      const current = currentTrackRef.current;
      if (!q.length || !current) {
        setIsPlaying(false);
        return;
      }

      const currentIndex = q.findIndex((t) => t.id === current.id);
      if (currentIndex === -1) return;

      let nextIndex = currentIndex + 1;

      if (isShuffleRef.current) {
        nextIndex = Math.floor(Math.random() * q.length);
      } else if (nextIndex >= q.length) {
        if (mode === "all") {
          nextIndex = 0;
        } else {
          setIsPlaying(false);
          return;
        }
      }

      if (playTrackRef.current) {
        playTrackRef.current(q[nextIndex]);
      }
    };

    audio.addEventListener("ended", handleTrackEnd);

    audio.addEventListener("playing", () => setIsLoading(false));
    audio.addEventListener("waiting", () => setIsLoading(true));

    return () => {
      audio.removeEventListener("timeupdate", updateTime);
      audio.removeEventListener("loadedmetadata", updateDuration);
      audio.removeEventListener("ended", handleTrackEnd);
      if (timeUpdateListener) timeUpdateListener.remove();
      audio.pause();
      audio.removeAttribute("src");
    };
  }, []);

  const playTrack = async (rawTrack: any, newQueue?: Track[]) => {
    if (!rawTrack) return;
    trackInitializedRef.current = true;
    let track = { ...rawTrack } as Track;
    if (!track.image) {
       track.image = rawTrack.album?.image || rawTrack.original?.album?.image || rawTrack.original?.image || "";
    }
    if (!track.artist || typeof track.artist !== 'string') {
       track.artist = rawTrack.artist?.name || rawTrack.performer?.name || rawTrack.original?.artist?.name || rawTrack.subtitle || "Unknown Artist";
    }

    const localCover = track.localCoverPath || (track.original && track.original.localCoverPath);
    if (localCover && Capacitor.isNativePlatform()) {
       try {
           const coverStat = await Filesystem.getUri({
               directory: Directory.Data,
               path: localCover.replace('file://', '')
           });
           track.image = coverStat.uri;
       } catch(e) {
           console.error("Failed to get local cover uri", e);
       }
    }

    const requestId = ++playRequestRef.current;
    setCurrentTrack(track);
    if (newQueue) setQueue(newQueue);

    setIsLoading(true);
    setIsPlaying(false);

    setDuration(track.duration || 0); // initial guess from metadata

    try {
      let streamUrl = track.streamUrl || "";
      const finalCoverUrl = getImageSrc(track.image) || "";
      const lp = track.localPath || track.local_path || (track.original && (track.original.localPath || track.original.local_path));
      if (!streamUrl && lp && Capacitor.isNativePlatform()) {
         try {
             const stat = await Filesystem.getUri({
                 directory: Directory.Data,
                 path: lp.replace('file://', '')
             });
             streamUrl = stat.uri;
         } catch(e) {
             console.error("Failed to get local uri", e);
         }
      }

      if (!streamUrl && track.local_path && Capacitor.isNativePlatform()) {
        streamUrl = track.local_path.startsWith('file://') ? track.local_path : `file://${track.local_path}`;
      } else if (!streamUrl) {
        try {
           streamUrl = await getQobuzTrackUrl(track.id.toString(), "5");
        } catch (networkError) {
           console.error("Failed to get stream URL (offline?):", networkError);
           setIsLoading(false);
           return;
        }
      }

      if (requestId !== playRequestRef.current) return;

      if (streamUrl && audioRef.current) {
        if (Capacitor.isNativePlatform()) {
          try {
            await QobuzAudio.play({ url: streamUrl });
            QobuzAudio.updateMetadata({
                title: track.title,
                artist: track.artist || "Desconocido",
                album: track.albumTitle || "Qobuz Audio",
                coverUrl: finalCoverUrl,
                duration: track.duration || 0
            });
            setIsPlaying(true);
            setIsLoading(false);
          } catch (playErr) {
            console.error("Native playback error:", playErr);
            setIsLoading(false);
            return;
          }
          // Start a dummy interval to update time since native plugin handles playback
          // Native time is handled by onTimeUpdate listener
          if (false) {
            (window as any).nativeTimeInterval = setInterval(() => {
              if (audioRef.current) {
                audioRef.current.currentTime += 0.5; // Dummy progression for UI
              }
            }, 500);
          }
        } else {
          audioRef.current.src = streamUrl;
          const playPromise = audioRef.current.play();
          if (playPromise !== undefined) {
            playPromise.catch((error) => {
              console.log("Playback interrupted:", error);
              console.log("Playback interrupted:", error);
            });
            setIsPlaying(true);
          }
        }
      }
    } catch (e) {
      if (requestId !== playRequestRef.current) return;
      console.error("Failed to play track", e);
      setIsLoading(false);
    }
  };

  playTrackRef.current = playTrack;

  const togglePlay = () => {
    if (!audioRef.current || !currentTrack) return;

    if (!trackInitializedRef.current) {
        playTrack(currentTrack);
        return;
    }

    if (isPlaying) {
      if (Capacitor.isNativePlatform()) {
        QobuzAudio.pause();
      } else {
        audioRef.current.pause();
      }
      setIsPlaying(false);
    } else {
      if (Capacitor.isNativePlatform()) {
        QobuzAudio.resume();
      } else {
        const playPromise = audioRef.current.play();
        if (playPromise !== undefined) {
          playPromise.catch((error) => {
            console.log("Playback interrupted:", error);
          });
        }
      }
      setIsPlaying(true);
    }
  };

  const seekTo = (time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      if (Capacitor.isNativePlatform()) {
        QobuzAudio.seek({ time });
      }
    }
  };

  const setVolume = (vol: number) => {
    if (audioRef.current) {
      audioRef.current.volume = vol;
      setVolumeState(vol);
    }
  };

  const nextTrack = () => {
    if (!queue.length || !currentTrack) return;
    const currentIndex = queue.findIndex((t) => t.id === currentTrack.id);
    let nextIndex = currentIndex + 1;
    if (isShuffle) {
      nextIndex = Math.floor(Math.random() * queue.length);
    } else if (nextIndex >= queue.length) {
      nextIndex = 0;
    }
    playTrack(queue[nextIndex]);
  };

  const prevTrack = () => {
    if (!queue.length || !currentTrack) return;

    // If we are more than 3 seconds in, just restart the track
    if (audioRef.current && audioRef.current.currentTime > 3) {
      seekTo(0);
      return;
    }

    const currentIndex = queue.findIndex((t) => t.id === currentTrack.id);
    let prevIndex = currentIndex - 1;
    if (prevIndex < 0) {
      prevIndex = queue.length - 1;
    }
    playTrack(queue[prevIndex]);
  };

  const toggleShuffle = () => setIsShuffle(!isShuffle);
  const toggleRepeat = () => {
    setRepeatMode((prev) => {
      if (prev === "off") return "all";
      if (prev === "all") return "one";
      return "off";
    });
  };
  useEffect(() => {
      if ("mediaSession" in navigator && currentTrack) {
        navigator.mediaSession.metadata = new MediaMetadata({
          title: currentTrack.title,
          artist: currentTrack.artist || "Desconocido",
          album: currentTrack.albumTitle || "Qobuz Audio",
          artwork: currentTrack.image ? [{ src: getImageSrc(currentTrack.image) || "",
                  sizes: "512x512",
                  type: "image/jpeg",
                },
                { src: getImageSrc(currentTrack.image) || "", sizes: "1024x1024",
                  type: "image/jpeg",
                }, // High-res
              ]
            : [],
        });
      }
    }, [currentTrack]);


    const nextTrackRef = useRef(nextTrack);
    const prevTrackRef = useRef(prevTrack);
    const togglePlayRef = useRef(togglePlay);
    const seekToRef = useRef(seekTo);

    useEffect(() => {
        nextTrackRef.current = nextTrack;
        prevTrackRef.current = prevTrack;
        togglePlayRef.current = togglePlay;
        seekToRef.current = seekTo;
    });

    useEffect(() => {
      if ("mediaSession" in navigator) {
        navigator.mediaSession.setActionHandler("play", () => togglePlayRef.current());
        navigator.mediaSession.setActionHandler("pause", () => togglePlayRef.current());
        navigator.mediaSession.setActionHandler("previoustrack", () => prevTrackRef.current());
        navigator.mediaSession.setActionHandler("nexttrack", () => nextTrackRef.current());
        navigator.mediaSession.setActionHandler("seekto", (details) => {
          if (details.seekTime !== undefined && details.seekTime !== null) {
            seekToRef.current(details.seekTime);
          }
        });
      }
      
      let promises: any[] = [];
      if (Capacitor.isNativePlatform()) {
          QobuzAudio.setupRemoteControls();
          promises.push(QobuzAudio.addListener('onRemotePlay', () => togglePlayRef.current()));
          promises.push(QobuzAudio.addListener('onRemotePause', () => togglePlayRef.current()));
          promises.push(QobuzAudio.addListener('onRemoteNext', () => nextTrackRef.current()));
          promises.push(QobuzAudio.addListener('onRemotePrev', () => prevTrackRef.current()));
          promises.push(QobuzAudio.addListener('onRemoteSeek', (info: any) => seekToRef.current(info.time)));
      }
      
      return () => {
         if (promises.length = 0) {
            Promise.all(promises).then(listeners => {
               listeners.forEach(l => l && l.remove && l.remove());
            });
         }
      };
    }, []);

    return (
      <PlayerContext.Provider
        value={{
          contextMenuTrack,
          setContextMenuTrack,
          downloadItem,
          setDownloadItem,
          currentTrack,
          isPlaying,
          isLoading,
          playTrack,
          togglePlay,
          duration,
          isExpanded,
          setIsExpanded,
          seekTo,
          volume,
          setVolume,
          queue,
          nextTrack,
          prevTrack,
          isShuffle,
          toggleShuffle,
          repeatMode,
          toggleRepeat,
          analyser: null,
          audioRef,
        }}
      >
        {children}
        <TrackContextMenu 
          track={contextMenuTrack?.item}
          itemType={contextMenuTrack?.type} 
          
          onClose={() => setContextMenuTrack(null)}
          onGoToAlbum={() => {
            const track = contextMenuTrack?.item;
            const albumId = track?.album?.id || track?.album?.qobuz_id || (contextMenuTrack?.type === 'album' ? (track?.id || track?.qobuz_id) : null);
            if (albumId) {
              setContextMenuTrack(null);
              document.dispatchEvent(new CustomEvent('open-overlay', { detail: { type: 'album', id: albumId } }));
            }
          }}
          onGoToArtist={() => {
            const track = contextMenuTrack?.item;
            const artistId = track?.artist?.id || track?.performer?.id || (contextMenuTrack?.type === 'artist' ? (track?.id || track?.qobuz_id) : null);
            if (artistId) {
              setContextMenuTrack(null);
              document.dispatchEvent(new CustomEvent('open-overlay', { detail: { type: 'artist', id: artistId } }));
            }
          }}
          onDownload={() => {

            if (contextMenuTrack) {
              setDownloadItem({item: contextMenuTrack.item, type: contextMenuTrack.type});
            }
          }}
        />
        {downloadItem && (
          <DownloadModal 
            item={downloadItem.item}
            type={downloadItem.type}
            onClose={() => setDownloadItem(null)}
          />
        )}
      </PlayerContext.Provider>
    );
  };

  export const usePlayer = () => {
    const context = useContext(PlayerContext);
    if (!context)
      throw new Error("usePlayer must be used within PlayerProvider");
    return context;
  };
