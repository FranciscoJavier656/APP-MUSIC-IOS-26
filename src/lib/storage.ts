// ═══════════════════════════════════════════════════════════
// storage.ts — Async storage layer using IndexedDB (localforage)
// Replaces synchronous localStorage for large data
// ═══════════════════════════════════════════════════════════

import localforage from 'localforage';

// Configure IndexedDB store
const store = localforage.createInstance({
  name: 'yagami-music',
  storeName: 'app_data',
  driver: [localforage.INDEXEDDB, localforage.WEBSQL, localforage.LOCALSTORAGE],
});

// ── Migration: move existing localStorage data to IndexedDB ──
let migrated = false;

async function migrateFromLocalStorage(): Promise<void> {
  if (migrated) return;
  migrated = true;

  const migrationFlag = await store.getItem<boolean>('_migrated_v1');
  if (migrationFlag) return;

  const keys = [
    'offline_library_tracks',
    'offline_tracks',
    'offline_library_albums',
    'offline_library_artists',
    'offline_library_playlists',
    'player_currentTrack',
    'player_queue',
    'theme',
  ];

  for (const key of keys) {
    try {
      const value = localStorage.getItem(key);
      if (value !== null) {
        // Try to parse JSON, fall back to raw string
        try {
          await store.setItem(key, JSON.parse(value));
        } catch {
          await store.setItem(key, value);
        }
        localStorage.removeItem(key);
      }
    } catch (e) {
      console.warn(`Migration failed for key "${key}":`, e);
    }
  }

  await store.setItem('_migrated_v1', true);
  console.log('✅ Storage migrated from localStorage to IndexedDB');
}

// Initialize migration on first import
migrateFromLocalStorage();

// ═══════════════════════════════════════════════════════════
// Typed getter/setter API
// ═══════════════════════════════════════════════════════════

// ── Offline Library ──

export async function getOfflineTracks(): Promise<Record<string, any>> {
  return (await store.getItem<Record<string, any>>('offline_tracks')) || {};
}

export async function setOfflineTracks(data: Record<string, any>): Promise<void> {
  await store.setItem('offline_tracks', data);
}

export async function getOfflineLibraryTracks(): Promise<Record<string, any>> {
  return (await store.getItem<Record<string, any>>('offline_library_tracks')) || {};
}

export async function setOfflineLibraryTracks(data: Record<string, any>): Promise<void> {
  await store.setItem('offline_library_tracks', data);
}

export async function getOfflineLibraryAlbums(): Promise<Record<string, any>> {
  return (await store.getItem<Record<string, any>>('offline_library_albums')) || {};
}

export async function setOfflineLibraryAlbums(data: Record<string, any>): Promise<void> {
  await store.setItem('offline_library_albums', data);
}

export async function getOfflineLibraryArtists(): Promise<Record<string, any>> {
  return (await store.getItem<Record<string, any>>('offline_library_artists')) || {};
}

export async function setOfflineLibraryArtists(data: Record<string, any>): Promise<void> {
  await store.setItem('offline_library_artists', data);
}

export async function getOfflineLibraryPlaylists(): Promise<Record<string, any>> {
  return (await store.getItem<Record<string, any>>('offline_library_playlists')) || {};
}

export async function setOfflineLibraryPlaylists(data: Record<string, any>): Promise<void> {
  await store.setItem('offline_library_playlists', data);
}

// ── Player State ──

export async function getPlayerCurrentTrack(): Promise<any | null> {
  return store.getItem('player_currentTrack');
}

export async function setPlayerCurrentTrack(track: any): Promise<void> {
  await store.setItem('player_currentTrack', track);
}

export async function getPlayerQueue(): Promise<any[] | null> {
  return store.getItem('player_queue');
}

export async function setPlayerQueue(queue: any[]): Promise<void> {
  await store.setItem('player_queue', queue);
}

// ── Theme ──

export async function getTheme(): Promise<string | null> {
  return store.getItem<string>('theme');
}

export async function setTheme(theme: string): Promise<void> {
  await store.setItem('theme', theme);
}

// ── Generic ──

export async function getItem<T>(key: string): Promise<T | null> {
  return store.getItem<T>(key);
}

export async function setItem<T>(key: string, value: T): Promise<void> {
  await store.setItem(key, value);
}

export async function removeItem(key: string): Promise<void> {
  await store.removeItem(key);
}
