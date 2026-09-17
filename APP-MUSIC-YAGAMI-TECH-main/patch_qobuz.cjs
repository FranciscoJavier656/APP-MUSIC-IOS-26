const fs = require('fs');

let code = fs.readFileSync('src/lib/qobuz.ts', 'utf8');

code = code.replace(
  "export const getQobuzPlaylist = async (playlistId: string) => {\n  if (Capacitor.isNativePlatform()) {\n    const res = await axios.get(`${QOBUZ_API}playlist/get`, {\n      params: { playlist_id: playlistId, extra: 'tracks' },",
  "export const getQobuzPlaylist = async (playlistId: string, limit?: number, offset?: number) => {\n  if (Capacitor.isNativePlatform()) {\n    const params: any = { playlist_id: playlistId, extra: 'tracks' };\n    if (limit) params.limit = limit;\n    if (offset) params.offset = offset;\n    const res = await axios.get(`${QOBUZ_API}playlist/get`, {\n      params,"
);

code = code.replace(
  "const res = await axios.get(`/api/playlist`, { params: { playlist_id: playlistId } });",
  "const params: any = { playlist_id: playlistId };\n  if (limit) params.limit = limit;\n  if (offset) params.offset = offset;\n  const res = await axios.get(`/api/playlist`, { params });"
);

fs.writeFileSync('src/lib/qobuz.ts', code);
