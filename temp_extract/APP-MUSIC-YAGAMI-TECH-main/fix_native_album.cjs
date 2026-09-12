const fs = require('fs');
let code = fs.readFileSync('src/lib/qobuz.ts', 'utf8');

code = code.replace(
  "params: { album_id: albumId, extra: 'tracks' },\n      headers: { 'x-app-id': qobuzAppId",
  "params: { album_id: albumId },\n      headers: { 'x-app-id': qobuzAppId"
);

fs.writeFileSync('src/lib/qobuz.ts', code);
