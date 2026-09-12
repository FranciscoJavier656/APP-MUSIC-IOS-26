const fs = require('fs');

const code = `
import axios from 'axios';
import { Capacitor } from '@capacitor/core';
import md5 from 'md5';

// Direct API credentials for Native mode
const qobuzAppId = import.meta.env.VITE_QOBUZ_APP_ID || '';
const qobuzSecret = import.meta.env.VITE_QOBUZ_APP_SECRET || '';
let qobuzToken = '';
try {
  const tokens = JSON.parse(import.meta.env.VITE_QOBUZ_USER_TOKEN || '[]');
  if (tokens.length > 0) qobuzToken = tokens[0];
  if (!qobuzToken) qobuzToken = import.meta.env.VITE_QOBUZ_USER_TOKEN || '';
} catch(e) {
  qobuzToken = import.meta.env.VITE_QOBUZ_USER_TOKEN || '';
}

const QOBUZ_API = 'https://www.qobuz.com/api.json/0.2/';

export const searchQobuz = async (query: string) => {
  if (Capacitor.isNativePlatform()) {
    const res = await axios.get(\`\${QOBUZ_API}catalog/search\`, {
      params: { query, limit: 10, offset: 0 },
      headers: { 'x-app-id': qobuzAppId, 'x-user-auth-token': qobuzToken || undefined }
    });
    return res.data;
  }
  const res = await axios.get(\`/api/search\`, { params: { q: query } });
  if (res.data.error) throw new Error(res.data.error);
  return res.data;
};

export const getQobuzAlbum = async (albumId: string) => {
  if (Capacitor.isNativePlatform()) {
    const res = await axios.get(\`\${QOBUZ_API}album/get\`, {
      params: { album_id: albumId, extra: 'tracks' },
      headers: { 'x-app-id': qobuzAppId, 'x-user-auth-token': qobuzToken || undefined }
    });
    return res.data;
  }
  const res = await axios.get(\`/api/album\`, { params: { album_id: albumId } });
  if (res.data.error) throw new Error(res.data.error);
  return res.data;
};

export const getQobuzPlaylist = async (playlistId: string) => {
  if (Capacitor.isNativePlatform()) {
    const res = await axios.get(\`\${QOBUZ_API}playlist/get\`, {
      params: { playlist_id: playlistId, extra: 'tracks' },
      headers: { 'x-app-id': qobuzAppId, 'x-user-auth-token': qobuzToken || undefined }
    });
    return res.data;
  }
  const res = await axios.get(\`/api/playlist\`, { params: { playlist_id: playlistId } });
  if (res.data.error) throw new Error(res.data.error);
  return res.data;
};

export const getQobuzTrackUrl = async (trackId: string, formatId: string = '5') => {
  if (Capacitor.isNativePlatform()) {
    const timestamp = Math.floor(Date.now() / 1000);
    const r_sig = \`trackgetFileUrlformat_id\${formatId}intentstreamtrack_id\${trackId}\${timestamp}\${qobuzSecret}\`;
    const r_sig_hashed = md5(r_sig);
    const res = await axios.get(\`\${QOBUZ_API}track/getFileUrl\`, {
      params: { format_id: formatId, intent: 'stream', track_id: trackId, request_ts: timestamp, request_sig: r_sig_hashed },
      headers: { 'x-app-id': qobuzAppId, 'x-user-auth-token': qobuzToken || undefined }
    });
    if (!res.data.url) throw new Error('No stream URL returned');
    return res.data.url;
  }
  const res = await axios.get(\`/api/stream\`, { params: { track_id: trackId, format_id: formatId } });
  if (res.data.error) throw new Error(res.data.error);
  return res.data.url;
};

export const getFeaturedAlbums = async (type: string = 'new-releases') => {
  if (Capacitor.isNativePlatform()) {
    const res = await axios.get(\`\${QOBUZ_API}album/getFeatured\`, {
      params: { type, limit: 15 },
      headers: { 'x-app-id': qobuzAppId, 'x-user-auth-token': qobuzToken || undefined }
    });
    return res.data;
  }
  const res = await axios.get(\`/api/featured\`, { params: { type } });
  if (res.data.error) throw new Error(res.data.error);
  return res.data;
};

export const getFeaturedPlaylists = async () => {
  if (Capacitor.isNativePlatform()) {
    const res = await axios.get(\`\${QOBUZ_API}playlist/getFeatured\`, {
      params: { type: 'editor-picks', limit: 15 },
      headers: { 'x-app-id': qobuzAppId, 'x-user-auth-token': qobuzToken || undefined }
    });
    return res.data;
  }
  const res = await axios.get(\`/api/playlists\`);
  if (res.data.error) throw new Error(res.data.error);
  return res.data;
};
`;

fs.writeFileSync('src/lib/qobuz.ts', code);
