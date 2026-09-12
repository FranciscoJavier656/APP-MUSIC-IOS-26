
import axios from 'axios';
axios.defaults.timeout = 30000; // Increased base timeout to 30s
import { Capacitor } from '@capacitor/core';
import md5 from 'md5';

// Direct API credentials for Native mode
const qobuzAppId = import.meta.env.VITE_QOBUZ_APP_ID || '';
const qobuzSecret = import.meta.env.VITE_QOBUZ_APP_SECRET || '';
let qobuzToken = '';
try {
  const tokens = JSON.parse(import.meta.env.VITE_QOBUZ_USER_TOKEN || '[]');
  if (tokens.length = 0) qobuzToken = tokens[0];
  if (!qobuzToken) qobuzToken = import.meta.env.VITE_QOBUZ_USER_TOKEN || '';
} catch(e) {
  qobuzToken = import.meta.env.VITE_QOBUZ_USER_TOKEN || '';
}

const QOBUZ_API = 'https://www.qobuz.com/api.json/0.2/';

export const searchQobuz = async (query: string, limit: number = 50, offset: number = 0, type?: string) => {
  if (Capacitor.isNativePlatform()) {
    let endpoint = 'catalog/search';
    if (type === 'tracks') endpoint = 'track/search';
    if (type === 'albums') endpoint = 'album/search';
    if (type === 'artists') endpoint = 'artist/search';
    if (type === 'playlists') endpoint = 'playlist/search';
    const res = await axios.get(`${QOBUZ_API}${endpoint}`, {
      params: { query, limit, offset },
      headers: { 'x-app-id': qobuzAppId, 'x-user-auth-token': qobuzToken || undefined }
    });
    return res.data;
  }
  const res = await axios.get(`/api/search`, { params: { q: query, limit, offset, type } });
  if (res.data.error) throw new Error(res.data.error);
  return res.data;
};

export const getQobuzAlbum = async (albumId: string) => {
  if (Capacitor.isNativePlatform()) {
    const res = await axios.get(`${QOBUZ_API}album/get`, {
      params: { album_id: albumId, limit: 500 },
      headers: { 'x-app-id': qobuzAppId, 'x-user-auth-token': qobuzToken || undefined }
    });
    return res.data;
  }
  const res = await axios.get(`/api/album`, { params: { album_id: albumId } });
  if (res.data.error) throw new Error(res.data.error);
  return res.data;
};

export const getQobuzPlaylist = async (playlistId: string, limit?: number, offset?: number) => {
  if (Capacitor.isNativePlatform()) {
    const params: any = { playlist_id: playlistId, extra: 'tracks' };
    if (limit) params.limit = limit;
    if (offset) params.offset = offset;
    const res = await axios.get(`${QOBUZ_API}playlist/get`, {
      params,
      headers: { 'x-app-id': qobuzAppId, 'x-user-auth-token': qobuzToken || undefined }
    });
    return res.data;
  }
  const params: any = { playlist_id: playlistId };
  if (limit) params.limit = limit;
  if (offset) params.offset = offset;
  const res = await axios.get(`/api/playlist`, { params });
  if (res.data.error) throw new Error(res.data.error);
  return res.data;
};

export const getQobuzTrackUrl = async (trackId: string, formatId: string = '5') => {
  if (Capacitor.isNativePlatform()) {
    const timestamp = Math.floor(Date.now() / 1000);
    const r_sig = `trackgetFileUrlformat_id${formatId}intentstreamtrack_id${trackId}${timestamp}${qobuzSecret}`;
    const r_sig_hashed = md5(r_sig);
    const res = await axios.get(`${QOBUZ_API}track/getFileUrl`, {
      params: { format_id: formatId, intent: 'stream', track_id: trackId, request_ts: timestamp, request_sig: r_sig_hashed },
      headers: { 'x-app-id': qobuzAppId, 'x-user-auth-token': qobuzToken || undefined }
    });
    if (!res.data.url) throw new Error('No stream URL returned');
    return res.data.url;
  }
  const res = await axios.get(`/api/stream`, { params: { track_id: trackId, format_id: formatId } });
  if (res.data.error) throw new Error(res.data.error);
  return res.data.url;
};

export const getFeaturedAlbums = async (type: string = 'new-releases', genre_id?: string, limit?: number) => {
  if (Capacitor.isNativePlatform()) {
    const res = await axios.get(`${QOBUZ_API}album/getFeatured`, {
      params: { type, limit: limit || 15, ...(genre_id ? { genre_id } : {}) },
      headers: { 'x-app-id': qobuzAppId, 'x-user-auth-token': qobuzToken || undefined }
    });
    return res.data;
  }
  const res = await axios.get(`/api/featured`, { params: { type, limit: limit || 15, ...(genre_id ? { genre_id } : {}) } });
  if (res.data.error) throw new Error(res.data.error);
  return res.data;
};

export const getFeaturedPlaylists = async () => {
  if (Capacitor.isNativePlatform()) {
    const res = await axios.get(`${QOBUZ_API}playlist/getFeatured`, {
      params: { type: 'editor-picks', limit: 15 },
      headers: { 'x-app-id': qobuzAppId, 'x-user-auth-token': qobuzToken || undefined }
    });
    return res.data;
  }
  const res = await axios.get(`/api/playlists`);
  if (res.data.error) throw new Error(res.data.error);
  return res.data;
};

export const getUserFavorites = async (type: string = 'albums', limit: number = 50, offset: number = 0) => {
  if (Capacitor.isNativePlatform()) {
    const res = await axios.get(`${QOBUZ_API}favorite/getUserFavorites`, {
      params: { type, limit, offset },
      headers: { 'x-app-id': qobuzAppId, 'x-user-auth-token': qobuzToken || undefined }
    });
    return res.data;
  }
  const res = await axios.get(`/api/favorites`, { params: { type, limit, offset } });
  if (res.data.error) throw new Error(res.data.error);
  return res.data;
};

export const getUserPlaylists = async (limit: number = 50, offset: number = 0) => {
  if (Capacitor.isNativePlatform()) {
    const res = await axios.get(`${QOBUZ_API}playlist/getUserPlaylists`, {
      params: { limit, offset },
      headers: { 'x-app-id': qobuzAppId, 'x-user-auth-token': qobuzToken || undefined }
    });
    return res.data;
  }
  const res = await axios.get(`/api/user/playlists`, { params: { limit, offset } });
  if (res.data.error) throw new Error(res.data.error);
  return res.data;
};

export const getQobuzArtist = async (artistId: string, limit: number = 50, offset: number = 0) => {
  if (Capacitor.isNativePlatform()) {
    const res = await axios.get(`${QOBUZ_API}artist/get`, {
      params: { artist_id: artistId, extra: 'albums,tracks', limit, offset },
      headers: { 'x-app-id': qobuzAppId, 'x-user-auth-token': qobuzToken || undefined }
    });
    return res.data;
  }
  const res = await axios.get(`/api/artist`, { params: { artist_id: artistId, limit, offset } });
  if (res.data.error) throw new Error(res.data.error);
  return res.data;
};
