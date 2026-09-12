const fs = require('fs');
let code = fs.readFileSync('src/lib/qobuz.ts', 'utf8');

// Update searchQobuz
code = code.replace(
  "export const searchQobuz = async (query: string) => {\n  if (Capacitor.isNativePlatform()) {\n    const res = await axios.get(`${QOBUZ_API}catalog/search`, {\n      params: { query, limit: 50, offset: 0 },\n      headers: { 'x-app-id': qobuzAppId, 'x-user-auth-token': qobuzToken || undefined }\n    });\n    return res.data;\n  }\n  const res = await axios.get(`/api/search`, { params: { q: query, limit: 50 } });",
  "export const searchQobuz = async (query: string, limit: number = 50, offset: number = 0) => {\n  if (Capacitor.isNativePlatform()) {\n    const res = await axios.get(`${QOBUZ_API}catalog/search`, {\n      params: { query, limit, offset },\n      headers: { 'x-app-id': qobuzAppId, 'x-user-auth-token': qobuzToken || undefined }\n    });\n    return res.data;\n  }\n  const res = await axios.get(`/api/search`, { params: { q: query, limit, offset } });"
);

// Update getQobuzArtist
code = code.replace(
  "export const getQobuzArtist = async (artistId: string) => {\n  if (Capacitor.isNativePlatform()) {\n    const res = await axios.get(`${QOBUZ_API}artist/get`, {\n      params: { artist_id: artistId, extra: 'albums,tracks' },\n      headers: { 'x-app-id': qobuzAppId, 'x-user-auth-token': qobuzToken || undefined }\n    });\n    return res.data;\n  }\n  const res = await axios.get(`/api/artist`, { params: { artist_id: artistId } });",
  "export const getQobuzArtist = async (artistId: string, limit: number = 50, offset: number = 0) => {\n  if (Capacitor.isNativePlatform()) {\n    const res = await axios.get(`${QOBUZ_API}artist/get`, {\n      params: { artist_id: artistId, extra: 'albums,tracks', limit, offset },\n      headers: { 'x-app-id': qobuzAppId, 'x-user-auth-token': qobuzToken || undefined }\n    });\n    return res.data;\n  }\n  const res = await axios.get(`/api/artist`, { params: { artist_id: artistId, limit, offset } });"
);

fs.writeFileSync('src/lib/qobuz.ts', code);
