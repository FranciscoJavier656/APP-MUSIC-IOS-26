import axios from 'axios';
import md5 from 'md5';

const qobuzApiBase = 'https://www.qobuz.com/api.json/0.2/';

export const getQobuzHeaders = () => {
  const appId = import.meta.env.VITE_QOBUZ_APP_ID;
  const token = import.meta.env.VITE_QOBUZ_USER_TOKEN;

  if (!appId) {
    throw new Error('Missing VITE_QOBUZ_APP_ID environment variable');
  }

  const headers: any = { 'x-app-id': appId };
  if (token) headers['x-user-auth-token'] = token;
  return headers;
};

export const searchQobuz = async (query: string) => {
  const res = await axios.get(`${qobuzApiBase}catalog/search`, {
    params: { query, limit: 20 },
    headers: getQobuzHeaders()
  });
  return res.data;
};

export const getQobuzAlbum = async (albumId: string) => {
  const res = await axios.get(`${qobuzApiBase}album/get`, {
    params: { album_id: albumId },
    headers: getQobuzHeaders()
  });
  return res.data;
};

export const getQobuzTrackUrl = async (trackId: string, formatId: string = '5') => {
  const secret = import.meta.env.VITE_QOBUZ_APP_SECRET;
  if (!secret) {
    throw new Error('Missing VITE_QOBUZ_APP_SECRET environment variable');
  }

  const timestamp = Math.floor(Date.now() / 1000);
  const r_sig = `trackgetFileUrlformat_id${formatId}intentstreamtrack_id${trackId}${timestamp}${secret}`;
  const r_sig_hashed = md5(r_sig);

  const res = await axios.get(`${qobuzApiBase}track/getFileUrl`, {
    params: { 
      format_id: formatId, 
      intent: 'stream', 
      track_id: trackId, 
      request_ts: timestamp, 
      request_sig: r_sig_hashed 
    },
    headers: getQobuzHeaders()
  });
  
  return res.data.url;
};
