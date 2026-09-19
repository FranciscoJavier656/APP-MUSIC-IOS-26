// ═══════════════════════════════════════════════════════════
// PlayerContext.tsx — Thin wrapper over Zustand store
// Maintains backward compatibility: usePlayer() works identically
// ═══════════════════════════════════════════════════════════

import React, { createContext, useContext, useRef, useEffect, ReactNode } from 'react';
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

  // Pull all state from Zustand store
  const state = usePlayerStore();

  // Build the legacy context value
  const contextValue: PlayerContextType = {
    contextMenuTrack: state.contextMenuTrack,
    setContextMenuTrack: state.setContextMenuTrack,
    downloadItem: state.downloadItem,
    setDownloadItem: state.setDownloadItem,
    currentTrack: state.currentTrack,
    isPlaying: state.isPlaying,
    isLoading: state.isLoading,
    duration: state.duration,
    isExpanded: state.isExpanded,
    setIsExpanded: state.setIsExpanded,
    playTrack: state.playTrack,
    setQueue: state.setQueue,
    togglePlay: state.togglePlay,
    seekTo: state.seekTo,
    setVolume: state.setVolume,
    volume: state.volume,
    queue: state.queue,
    nextTrack: state.nextTrack,
    prevTrack: state.prevTrack,
    isShuffle: state.isShuffle,
    toggleShuffle: state.toggleShuffle,
    repeatMode: state.repeatMode,
    toggleRepeat: state.toggleRepeat,
    analyser: null,
    audioRef,
  };

  return (
    <PlayerContext.Provider value={contextValue}>
      {children}
      <TrackContextMenu
        track={state.contextMenuTrack?.item}
        itemType={state.contextMenuTrack?.type}
        onClose={() => state.setContextMenuTrack(null)}
        onGoToAlbum={() => {
          const track = state.contextMenuTrack?.item;
          const albumId =
            track?.album?.id ||
            track?.album?.qobuz_id ||
            (state.contextMenuTrack?.type === 'album' ? track?.id || track?.qobuz_id : null);
          if (albumId) {
            state.setContextMenuTrack(null);
            document.dispatchEvent(new CustomEvent('open-overlay', { detail: { type: 'album', id: albumId } }));
          }
        }}
        onGoToArtist={() => {
          const track = state.contextMenuTrack?.item;
          const artistId =
            track?.artist?.id ||
            track?.performer?.id ||
            (state.contextMenuTrack?.type === 'artist' ? track?.id || track?.qobuz_id : null);
          if (artistId) {
            state.setContextMenuTrack(null);
            document.dispatchEvent(new CustomEvent('open-overlay', { detail: { type: 'artist', id: artistId } }));
          }
        }}
        onDownload={() => {
          if (state.contextMenuTrack) {
            state.setDownloadItem({ item: state.contextMenuTrack.item, type: state.contextMenuTrack.type });
          }
        }}
      />
      {state.downloadItem && (
        <DownloadModal
          item={state.downloadItem.item}
          type={state.downloadItem.type}
          onClose={() => state.setDownloadItem(null)}
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
