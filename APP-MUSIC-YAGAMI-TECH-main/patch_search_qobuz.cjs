const fs = require('fs');
let code = fs.readFileSync('src/lib/qobuz.ts', 'utf8');

code = code.replace(
  "export const searchQobuz = async (query: string, limit: number = 50, offset: number = 0) => {\n  if (Capacitor.isNativePlatform()) {\n    const res = await axios.get(`${QOBUZ_API}catalog/search`, {\n      params: { query, limit, offset },\n      headers: { 'x-app-id': qobuzAppId, 'x-user-auth-token': qobuzToken || undefined }\n    });\n    return res.data;\n  }\n  const res = await axios.get(`/api/search`, { params: { q: query, limit, offset } });",
  "export const searchQobuz = async (query: string, limit: number = 50, offset: number = 0, type?: string) => {\n  if (Capacitor.isNativePlatform()) {\n    let endpoint = 'catalog/search';\n    if (type === 'tracks') endpoint = 'track/search';\n    if (type === 'albums') endpoint = 'album/search';\n    if (type === 'artists') endpoint = 'artist/search';\n    if (type === 'playlists') endpoint = 'playlist/search';\n    const res = await axios.get(`${QOBUZ_API}${endpoint}`, {\n      params: { query, limit, offset },\n      headers: { 'x-app-id': qobuzAppId, 'x-user-auth-token': qobuzToken || undefined }\n    });\n    return res.data;\n  }\n  const res = await axios.get(`/api/search`, { params: { q: query, limit, offset, type } });"
);

fs.writeFileSync('src/lib/qobuz.ts', code);
