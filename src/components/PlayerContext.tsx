// ═══════════════════════════════════════════════════════════
// PlayerContext.tsx — Thin wrapper over Zustand store
// Maintains backward compatibility: usePlayer() works identically
// ═══════════════════════════════════════════════════════════

import React, { createContext, useContext, useRef, useEffect, useMemo, useCallback, ReactNode } from 'react';
import { usePlayerStore, initPlayerEngine, type Track } from '../lib/playerStore';
import TrackContextMenu from './TrackContextMenu';
import DownloadModal from './DownloadModal';

// Re-export Track type for backward compatibility
export type { Track };

// ── Legacy interface (unchanged for consumers) ──
interface PlayerContextType {
  contextMenuTrack: { item: any; type: 'album' | 'track' | 'playlist' | 'artist' } | null;
  setContextMenuTrack: (track: { item: any; type: 'album' | 'track' | 'playlist' | 'artist' } | null) => void;
  downloadItem: { item: any; type: 'album' | 'track' | 'playlist' | 'artist' } | null;
  setDownloadItem: (item: { item: any; type: 'album' | 'track' | 'playlist' | 'artist' } | null) => void;
  currentTrack: Track | null;
  isPlaying: boolean;
  isLoading: boolean;
  duration: number;
  isExpanded: boolean;
  setIsExpanded: (expanded: boolean) => void;
  playTrack: (track: Track, queue?: Track[]) => void;
  setQueue: (queue: Track[]) => void;
  togglePlay: () => void;
  seekTo: (time: number) => void;
  setVolume: (volume: number) => void;
  volume: number;
  queue: Track[];
  nextTrack: () => void;
  prevTrack: () => void;
  isShuffle: boolean;
  toggleShuffle: () => void;
  repeatMode: 'off' | 'all' | 'one';
  toggleRepeat: () => void;
  analyser: any;
  audioRef: React.MutableRefObject<HTMLAudioElement | null>;
}

const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

export function PlayerProvider({ children }: { children: ReactNode }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const cleanupRef = useRef<(() => void) | null>(null);

  // Initialize audio engine once on mount
  useEffect(() => {
    cleanupRef.current = initPlayerEngine(audioRef);
    
    // Listen for custom events from other components (like Sleep Timer)
    const handlePausePlayback = () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
    document.addEventListener('pause-playback', handlePausePlayback);

    return () => {
      if (cleanupRef.current) cleanupRef.current();
      document.removeEventListener('pause-playback', handlePausePlayback);
    };
  }, []);

  // Granular subscriptions so PlayerProvider only re-renders when relevant state changes
  const currentTrack = usePlayerStore((s) => s.currentTrack);
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const isLoading = usePlayerStore((s) => s.isLoading);
  const duration = usePlayerStore((s) => s.duration);
  const isExpanded = usePlayerStore((s) => s.isExpanded);
  const volume = usePlayerStore((s) => s.volume);
  const queue = usePlayerStore((s) => s.queue);
  const isShuffle = usePlayerStore((s) => s.isShuffle);
  const repeatMode = usePlayerStore((s) => s.repeatMode);
  const contextMenuTrack = usePlayerStore((s) => s.contextMenuTrack);
  const downloadItem = usePlayerStore((s) => s.downloadItem);

  // Stable action callbacks delegating to the Zustand store
  const setContextMenuTrack = useCallback(
    (track: { item: any; type: 'album' | 'track' | 'playlist' | 'artist' } | null) => {
      usePlayerStore.getState().setContextMenuTrack(track);
    },
    []
  );

  const setDownloadItem = useCallback(
    (item: { item: any; type: 'album' | 'track' | 'playlist' | 'artist' } | null) => {
      usePlayerStore.getState().setDownloadItem(item);
    },
    []
  );

  const setIsExpanded = useCallback((expanded: boolean) => {
    usePlayerStore.getState().setIsExpanded(expanded);
  }, []);

  const playTrack = useCallback((track: Track, newQueue?: Track[]) => {
    usePlayerStore.getState().playTrack(track, newQueue);
  }, []);

  const setQueue = useCallback((newQueue: Track[]) => {
    usePlayerStore.getState().setQueue(newQueue);
  }, []);

  const togglePlay = useCallback(() => {
    usePlayerStore.getState().togglePlay();
  }, []);

  const seekTo = useCallback((time: number) => {
    usePlayerStore.getState().seekTo(time);
  }, []);

  const setVolume = useCallback((vol: number) => {
    usePlayerStore.getState().setVolume(vol);
  }, []);

  const nextTrack = useCallback(() => {
    usePlayerStore.getState().nextTrack();
  }, []);

  const prevTrack = useCallback(() => {
    usePlayerStore.getState().prevTrack();
  }, []);

  const toggleShuffle = useCallback(() => {
    usePlayerStore.getState().toggleShuffle();
  }, []);

  const toggleRepeat = useCallback(() => {
    usePlayerStore.getState().toggleRepeat();
  }, []);

  // Memoize legacy context value to protect downstream consumers
  const contextValue = useMemo<PlayerContextType>(() => ({
    contextMenuTrack,
    setContextMenuTrack,
    downloadItem,
    setDownloadItem,
    currentTrack,
    isPlaying,
    isLoading,
    duration,
    isExpanded,
    setIsExpanded,
    playTrack,
    setQueue,
    togglePlay,
    seekTo,
    setVolume,
    volume,
    queue,
    nextTrack,
    prevTrack,
    isShuffle,
    toggleShuffle,
    repeatMode,
    toggleRepeat,
    analyser: null,
    audioRef,
  }), [
    contextMenuTrack,
    setContextMenuTrack,
    downloadItem,
    setDownloadItem,
    currentTrack,
    isPlaying,
    isLoading,
    duration,
    isExpanded,
    setIsExpanded,
    playTrack,
    setQueue,
    togglePlay,
    seekTo,
    setVolume,
    volume,
    queue,
    nextTrack,
    prevTrack,
    isShuffle,
    toggleShuffle,
    repeatMode,
    toggleRepeat,
    audioRef,
  ]);

  return (
    <PlayerContext.Provider value={contextValue}>
      {children}
      <TrackContextMenu
        track={contextMenuTrack?.item}
        itemType={contextMenuTrack?.type}
        onClose={() => setContextMenuTrack(null)}
        onGoToAlbum={() => {
          const track = contextMenuTrack?.item;
          const albumId =
            track?.album?.id ||
            track?.album?.qobuz_id ||
            (contextMenuTrack?.type === 'album' ? track?.id || track?.qobuz_id : null);
          if (albumId) {
            setContextMenuTrack(null);
            document.dispatchEvent(new CustomEvent('open-overlay', { detail: { type: 'album', id: albumId } }));
          }
        }}
        onGoToArtist={() => {
          const track = contextMenuTrack?.item;
          const artistId =
            track?.artist?.id ||
            track?.performer?.id ||
            (contextMenuTrack?.type === 'artist' ? track?.id || track?.qobuz_id : null);
          if (artistId) {
            setContextMenuTrack(null);
            document.dispatchEvent(new CustomEvent('open-overlay', { detail: { type: 'artist', id: artistId } }));
          }
        }}
        onDownload={() => {
          if (contextMenuTrack) {
            setDownloadItem({ item: contextMenuTrack.item, type: contextMenuTrack.type });
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
}

// ── Hook (backward-compatible) ──
export const usePlayer = () => {
  const context = useContext(PlayerContext);
  if (!context) throw new Error('usePlayer must be used within PlayerProvider');
  return context;
};
