// ═══════════════════════════════════════════════════════════
// eventBus.ts — Typed global event bus using mitt
// Replaces untyped window.dispatchEvent(CustomEvent) pattern
// ═══════════════════════════════════════════════════════════

import mitt from 'mitt';

export type AppEvents = {
  // Tab bar visibility
  'tabbar:hide': void;
  'tabbar:show': void;

  // Navigation & overlays
  'open-overlay': { type: 'album' | 'artist' | 'playlist'; id: string };
  navigate: string;

  // Audio visualization
  fft_data: { data: number[] };

  // Download pipeline
  download_state: { trackId: string; status: string };
  download_progress: { trackId: string; progress: number; bytes: number; total: number };
  download_error: { trackId: string; error: string };
  'offline-library-updated': void;

  // Native bridge → React
  'toggle-play': void;
  'expand-player': void;
};

const bus = mitt<AppEvents>();

export default bus;
