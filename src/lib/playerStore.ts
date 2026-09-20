// ═══════════════════════════════════════════════════════════
// playerStore.ts — Zustand store for player state
// Replaces React Context with granular subscriptions
// ═══════════════════════════════════════════════════════════

import { create } from 'zustand';
import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { getQobuzTrackUrl } from './qobuz';
import { getImageSrc } from './image';
import { QobuzAudio } from './QobuzAudioPlugin';

// ── Types ──
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

interface PlayerState {
  // ── State ──
  currentTrack: Track | null;
  queue: Track[];
  isPlaying: boolean;
  isLoading: boolean;
  duration: number;
  isExpanded: boolean;
  volume: number;
  isShuffle: boolean;
  repeatMode: 'off' | 'all' | 'one';
  contextMenuTrack: { item: any; type: 'album' | 'track' | 'playlist' | 'artist' } | null;
  downloadItem: { item: any; type: 'album' | 'track' | 'playlist' | 'artist' } | null;

  // ── Actions ──
  setCurrentTrack: (track: Track | null) => void;
  setQueue: (queue: Track[]) => void;
  setIsPlaying: (playing: boolean) => void;
  setIsLoading: (loading: boolean) => void;
  setDuration: (duration: number) => void;
  setIsExpanded: (expanded: boolean) => void;
  setVolume: (volume: number) => void;
  setIsShuffle: (shuffle: boolean) => void;
  setRepeatMode: (mode: 'off' | 'all' | 'one') => void;
  setContextMenuTrack: (track: { item: any; type: 'album' | 'track' | 'playlist' | 'artist' } | null) => void;
  setDownloadItem: (item: { item: any; type: 'album' | 'track' | 'playlist' | 'artist' } | null) => void;

  // ── Complex actions (set by PlayerEngine) ──
  playTrack: (track: Track, queue?: Track[]) => void;
  togglePlay: () => void;
  seekTo: (time: number) => void;
  nextTrack: () => void;
  prevTrack: () => void;
  toggleShuffle: () => void;
  toggleRepeat: () => void;
}

// ── Create the Zustand store ──
export const usePlayerStore = create<PlayerState>((set, get) => ({
  // ── Initial State ──
  currentTrack: null,
  queue: [],
  isPlaying: false,
  isLoading: false,
  duration: 0,
  isExpanded: false,
  volume: 1,
  isShuffle: false,
  repeatMode: 'off',
  contextMenuTrack: null,
  downloadItem: null,

  // ── Simple setters ──
  setCurrentTrack: (track) => set({ currentTrack: track }),
  setQueue: (queue) => set({ queue }),
  setIsPlaying: (playing) => set({ isPlaying: playing }),
  setIsLoading: (loading) => set({ isLoading: loading }),
  setDuration: (duration) => set({ duration }),
  setIsExpanded: (expanded) => set({ isExpanded: expanded }),
  setVolume: (volume) => set({ volume }),
  setIsShuffle: (shuffle) => set({ isShuffle: shuffle }),
  setRepeatMode: (mode) => set({ repeatMode: mode }),
  setContextMenuTrack: (track) => set({ contextMenuTrack: track }),
  setDownloadItem: (item) => set({ downloadItem: item }),

  // ── Complex actions (initialized as no-ops, wired by PlayerEngine) ──
  playTrack: () => {},
  togglePlay: () => {},
  seekTo: () => {},
  nextTrack: () => {},
  prevTrack: () => {},
  toggleShuffle: () => set((s) => ({ isShuffle: !s.isShuffle })),
  toggleRepeat: () =>
    set((s) => ({
      repeatMode: s.repeatMode === 'off' ? 'all' : s.repeatMode === 'all' ? 'one' : 'off',
    })),
}));

// ═══════════════════════════════════════════════════════════
// PlayerEngine — Initializes audio engine and wires actions
// Called once from PlayerProvider on mount
// ═══════════════════════════════════════════════════════════

export function initPlayerEngine(audioRef: React.MutableRefObject<HTMLAudioElement | null>) {
  const store = usePlayerStore;
  let playRequestCounter = 0;
  let trackInitialized = false;

  // ── Persistence: save to localStorage ──
  const persistState = () => {
    const { currentTrack, queue } = store.getState();
    if (currentTrack) {
      try { localStorage.setItem('player_currentTrack', JSON.stringify(currentTrack)); } catch {}
    }
    if (queue.length > 0) {
      try { localStorage.setItem('player_queue', JSON.stringify(queue)); } catch {}
    }
  };

  // Subscribe to track/queue changes for persistence
  store.subscribe((state, prevState) => {
    if (state.currentTrack !== prevState.currentTrack || state.queue !== prevState.queue) {
      persistState();
    }
  });

  // ── Restore persisted state ──
  try {
    const savedTrack = localStorage.getItem('player_currentTrack');
    const savedQueue = localStorage.getItem('player_queue');
    if (savedTrack) store.setState({ currentTrack: JSON.parse(savedTrack) });
    if (savedQueue) store.setState({ queue: JSON.parse(savedQueue) });
  } catch (e) {
    console.warn('Failed to restore player state', e);
  }

  // ── Play Track ──
  const playTrack = async (rawTrack: any, newQueue?: Track[]) => {
    if (!rawTrack) return;
    trackInitialized = true;
    let track = { ...rawTrack } as Track;
    if (!track.image) {
      track.image = rawTrack.album?.image || rawTrack.original?.album?.image || rawTrack.original?.image || '';
    }
    if (!track.artist || typeof track.artist !== 'string') {
      track.artist =
        rawTrack.artist?.name || rawTrack.performer?.name || rawTrack.original?.artist?.name || rawTrack.subtitle || 'Unknown Artist';
    }

    // Resolve local cover
    const localCover = track.localCoverPath || (track.original && track.original.localCoverPath);
    if (localCover && Capacitor.isNativePlatform()) {
      try {
        const coverStat = await Filesystem.getUri({
          directory: Directory.Data,
          path: localCover.replace('file://', ''),
        });
        track.image = coverStat.uri;
      } catch (e) {
        console.error('Failed to get local cover uri', e);
      }
    }

    const requestId = ++playRequestCounter;
    store.setState({
      currentTrack: track,
      ...(newQueue ? { queue: newQueue } : {}),
      isLoading: true,
      isPlaying: false,
      duration: track.duration || 0,
    });

    try {
      let streamUrl = track.streamUrl || '';
      const finalCoverUrl = getImageSrc(track.image) || '';
      const lp = track.localPath || track.local_path || (track.original && (track.original.localPath || track.original.local_path));

      if (!streamUrl && lp && Capacitor.isNativePlatform()) {
        try {
          const stat = await Filesystem.getUri({ directory: Directory.Data, path: lp.replace('file://', '') });
          streamUrl = stat.uri;
        } catch (e) {
          console.error('Failed to get local uri', e);
        }
      }

      if (!streamUrl && track.local_path && Capacitor.isNativePlatform()) {
        streamUrl = track.local_path.startsWith('file://') ? track.local_path : `file://${track.local_path}`;
      } else if (!streamUrl) {
        try {
          streamUrl = await getQobuzTrackUrl(track.id.toString(), '5');
        } catch (networkError) {
          console.error('Failed to get stream URL (offline?):', networkError);
          store.setState({ isLoading: false });
          return;
        }
      }

      if (requestId !== playRequestCounter) return;

      if (streamUrl && audioRef.current) {
        if (Capacitor.isNativePlatform()) {
          try {
            await QobuzAudio.play({ url: streamUrl });
            QobuzAudio.updateMetadata({
              title: track.title,
              artist: track.artist || 'Desconocido',
              album: track.albumTitle || 'Qobuz Audio',
              coverUrl: finalCoverUrl,
              duration: track.duration || 0,
            });
            store.setState({ isPlaying: true, isLoading: false });
            
            // Report Playback to Qobuz for stats/royalties
            import('./qobuz').then(({ reportTrackPlay }) => {
              reportTrackPlay(track.id.toString(), track.duration || 30).catch(() => {});
            });
          } catch (playErr) {
            console.error('Native playback error:', playErr);
            store.setState({ isLoading: false });
            return;
          }
        } else {
          audioRef.current.src = streamUrl;
          const playPromise = audioRef.current.play();
          if (playPromise !== undefined) {
            playPromise.catch((error) => console.log('Playback interrupted:', error));
            store.setState({ isPlaying: true });
            
            import('./qobuz').then(({ reportTrackPlay }) => {
              reportTrackPlay(track.id.toString(), track.duration || 30).catch(() => {});
            });
          }
        }
      }
    } catch (e) {
      if (requestId !== playRequestCounter) return;
      console.error('Failed to play track', e);
      store.setState({ isLoading: false });
    }
  };

  // ── Toggle Play ──
  const togglePlay = () => {
    const { currentTrack, isPlaying } = store.getState();
    if (!audioRef.current || !currentTrack) return;

    if (!trackInitialized) {
      playTrack(currentTrack);
      return;
    }

    if (isPlaying) {
      if (Capacitor.isNativePlatform()) {
        QobuzAudio.pause();
      } else {
        audioRef.current.pause();
      }
      store.setState({ isPlaying: false });
    } else {
      if (Capacitor.isNativePlatform()) {
        QobuzAudio.resume();
      } else {
        const playPromise = audioRef.current.play();
        if (playPromise !== undefined) {
          playPromise.catch((error) => console.log('Playback interrupted:', error));
        }
      }
      store.setState({ isPlaying: true });
    }
  };

  // ── Seek ──
  const seekTo = (time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      if (Capacitor.isNativePlatform()) {
        QobuzAudio.seek({ time });
      }
    }
  };

  // ── Set Volume ──
  const setVolume = (vol: number) => {
    if (audioRef.current) {
      audioRef.current.volume = vol;
      store.setState({ volume: vol });
    }
  };

  // ── Next Track ──
  const nextTrack = () => {
    const { queue, currentTrack, isShuffle } = store.getState();
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

  // ── Prev Track ──
  const prevTrack = () => {
    const { queue, currentTrack } = store.getState();
    if (!queue.length || !currentTrack) return;
    if (audioRef.current && audioRef.current.currentTime > 3) {
      seekTo(0);
      return;
    }
    const currentIndex = queue.findIndex((t) => t.id === currentTrack.id);
    let prevIndex = currentIndex - 1;
    if (prevIndex < 0) prevIndex = queue.length - 1;
    playTrack(queue[prevIndex]);
  };

  // ── Handle Track End ──
  const handleTrackEnd = () => {
    const { repeatMode, queue, currentTrack, isShuffle } = store.getState();
    if (repeatMode === 'one') {
      if (Capacitor.isNativePlatform()) {
        seekTo(0);
        if (currentTrack) playTrack(currentTrack);
      } else {
        if (audioRef.current) audioRef.current.currentTime = 0;
        const playPromise = audioRef.current?.play();
        if (playPromise !== undefined) {
          playPromise.catch((e) => console.log('Playback interrupted:', e));
        }
      }
      return;
    }

    if (!queue.length || !currentTrack) {
      store.setState({ isPlaying: false });
      return;
    }

    const currentIndex = queue.findIndex((t) => t.id === currentTrack.id);
    if (currentIndex === -1) return;

    let nextIndex = currentIndex + 1;
    if (isShuffle) {
      nextIndex = Math.floor(Math.random() * queue.length);
    } else if (nextIndex >= queue.length) {
      if (repeatMode === 'all') {
        nextIndex = 0;
      } else {
        // Infinity Play (Autoplay)
        import('./qobuz').then(({ getSimilarTracks }) => {
            getSimilarTracks(currentTrack.id, 20).then(res => {
                const similar = res?.tracks?.items || res?.items || [];
                if (similar.length > 0) {
                    // Filter out tracks already in queue
                    const newTracks = similar.filter((t: any) => !queue.some((q) => q.id === t.id));
                    if (newTracks.length > 0) {
                        const newQueue = [...queue, ...newTracks];
                        store.setState({ queue: newQueue });
                        playTrack(newTracks[0]);
                        return;
                    }
                }
                store.setState({ isPlaying: false });
            }).catch(() => {
                store.setState({ isPlaying: false });
            });
        });
        return;
      }
    }
    playTrack(queue[nextIndex]);
  };

  // ── Wire actions into store ──
  store.setState({
    playTrack,
    togglePlay,
    seekTo,
    nextTrack,
    prevTrack,
    setVolume,
  });

  // ── Setup audio element ──
  audioRef.current = new Audio();
  const audio = audioRef.current;
  audio.crossOrigin = 'anonymous';

  let audioCtx: AudioContext | null = null;
  let analyserNode: AnalyserNode | null = null;
  let animationFrameId: number;

  // Web Audio FFT (web only)
  if (!Capacitor.isNativePlatform()) {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      audioCtx = new AudioContextClass();
      analyserNode = audioCtx.createAnalyser();
      analyserNode.fftSize = 256;

      const sourceNode = audioCtx.createMediaElementSource(audio);
      sourceNode.connect(analyserNode);
      analyserNode.connect(audioCtx.destination);

      const dataArray = new Uint8Array(analyserNode.frequencyBinCount);

      const dispatchFft = () => {
        if (!audio.paused && analyserNode && document.visibilityState === 'visible') {
          analyserNode.getByteFrequencyData(dataArray);
          window.dispatchEvent(new CustomEvent('fft_data', { detail: { data: Array.from(dataArray) } }));
          animationFrameId = requestAnimationFrame(dispatchFft);
        } else {
          animationFrameId = 0;
        }
      };

      const checkFft = () => {
        if (!animationFrameId && !audio.paused && document.visibilityState === 'visible') {
          dispatchFft();
        }
      };

      audio.addEventListener('play', () => {
        if (audioCtx?.state === 'suspended') audioCtx.resume();
        checkFft();
      });
      document.addEventListener('visibilitychange', checkFft);
    } catch (e) {
      console.warn('Web Audio API FFT failed', e);
    }
  }

  // HTML5 audio events
  const updateDuration = () => store.setState({ duration: audio.duration || 0 });
  audio.addEventListener('loadedmetadata', updateDuration);
  audio.addEventListener('ended', handleTrackEnd);
  audio.addEventListener('playing', () => store.setState({ isLoading: false }));
  audio.addEventListener('waiting', () => store.setState({ isLoading: true }));

  // Native listeners
  let timeUpdateListener: any;
  let nativeEndListener: any;
  let appStateListener: any;
  if (Capacitor.isNativePlatform()) {
    import('@capacitor/app').then(({ App }) => {
      App.addListener('appStateChange', ({ isActive }) => {
        if (QobuzAudio.setFftEnabled) QobuzAudio.setFftEnabled({ enabled: isActive });
      }).then((l: any) => (appStateListener = l));
    });

    QobuzAudio.addListener('onTimeUpdate', (info) => {
      if (audioRef.current) {
        let latency = 0;
        if (info.timestamp) {
            latency = (Date.now() - info.timestamp) / 1000.0;
            // Prevent negative latency in case of slight clock mismatches
            if (latency < 0) latency = 0;
            // If latency is ridiculously high (e.g. paused for a while), cap it
            if (latency > 2.0) latency = 0; 
        }
        (audioRef.current as any).nativeCurrentTime = info.currentTime + latency;
        (audioRef.current as any).nativeDuration = info.duration;
        store.setState({ duration: info.duration });
      }
    }).then((l) => (timeUpdateListener = l));

    QobuzAudio.addListener('onEnded', () => handleTrackEnd()).then((l) => (nativeEndListener = l));
  }

  // MediaSession
  if ('mediaSession' in navigator) {
    navigator.mediaSession.setActionHandler('play', () => store.getState().togglePlay());
    navigator.mediaSession.setActionHandler('pause', () => store.getState().togglePlay());
    navigator.mediaSession.setActionHandler('previoustrack', () => store.getState().prevTrack());
    navigator.mediaSession.setActionHandler('nexttrack', () => store.getState().nextTrack());
    navigator.mediaSession.setActionHandler('seekto', (details) => {
      if (details.seekTime !== undefined && details.seekTime !== null) {
        store.getState().seekTo(details.seekTime);
      }
    });
  }

  // Native remote controls
  if (Capacitor.isNativePlatform()) {
    QobuzAudio.setupRemoteControls();
    QobuzAudio.addListener('onRemotePlay', () => store.getState().togglePlay());
    QobuzAudio.addListener('onRemotePause', () => store.getState().togglePlay());
    QobuzAudio.addListener('onRemoteNext', () => store.getState().nextTrack());
    QobuzAudio.addListener('onRemotePrev', () => store.getState().prevTrack());
    QobuzAudio.addListener('onRemoteSeek', (info: any) => store.getState().seekTo(info.time));
  }

  // MediaSession metadata sync
  store.subscribe((state, prevState) => {
    if (state.currentTrack !== prevState.currentTrack && state.currentTrack && 'mediaSession' in navigator) {
      const track = state.currentTrack;
      navigator.mediaSession.metadata = new MediaMetadata({
        title: track.title,
        artist: track.artist || 'Desconocido',
        album: track.albumTitle || 'Qobuz Audio',
        artwork: track.image
          ? [
              { src: getImageSrc(track.image) || '', sizes: '512x512', type: 'image/jpeg' },
              { src: getImageSrc(track.image) || '', sizes: '1024x1024', type: 'image/jpeg' },
            ]
          : [],
      });
    }
  });

  // ── Cleanup function ──
  return () => {
    if (animationFrameId) cancelAnimationFrame(animationFrameId);
    audio.removeEventListener('loadedmetadata', updateDuration);
    audio.removeEventListener('ended', handleTrackEnd);
    if (timeUpdateListener) timeUpdateListener.remove();
    if (appStateListener) appStateListener.remove();
    audio.pause();
    audio.removeAttribute('src');
  };
}

// ═══════════════════════════════════════════════════════════
// Granular selectors for performance-critical components
// ═══════════════════════════════════════════════════════════

export const usePlayerTrack = () => usePlayerStore((s) => s.currentTrack);
export const usePlayerPlaying = () => usePlayerStore((s) => s.isPlaying);
export const usePlayerLoading = () => usePlayerStore((s) => s.isLoading);
export const usePlayerDuration = () => usePlayerStore((s) => s.duration);
export const usePlayerExpanded = () => usePlayerStore((s) => s.isExpanded);
export const usePlayerQueue = () => usePlayerStore((s) => s.queue);
export const usePlayerShuffle = () => usePlayerStore((s) => s.isShuffle);
export const usePlayerRepeat = () => usePlayerStore((s) => s.repeatMode);
