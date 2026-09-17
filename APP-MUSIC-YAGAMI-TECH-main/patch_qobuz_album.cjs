const fs = require('fs');
let code = fs.readFileSync('src/lib/qobuz.ts', 'utf8');

code = code.replace(
  "export const getQobuzAlbum = async (albumId: string) => {\n  if (Capacitor.isNativePlatform()) {\n    const res = await axios.get(`${QOBUZ_API}album/get`, {\n      params: { album_id: albumId },",
  "export const getQobuzAlbum = async (albumId: string) => {\n  if (Capacitor.isNativePlatform()) {\n    const res = await axios.get(`${QOBUZ_API}album/get`, {\n      params: { album_id: albumId, limit: 500 },"
);

fs.writeFileSync('src/lib/qobuz.ts', code);
