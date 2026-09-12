const fs = require('fs');

let serverCode = fs.readFileSync('server.ts', 'utf8');

serverCode = serverCode.replace(
  "app.get('/api/playlist', async (req, res) => {\n  if (!qobuzAppId) return res.status(400).json({ error: 'QOBUZ_APP_ID not configured.' });\n  const { playlist_id } = req.query;\n  try {\n    const response = await axios.get(`${qobuzApiBase}playlist/get`, {\n      params: { playlist_id, extra: 'tracks' },",
  "app.get('/api/playlist', async (req, res) => {\n  if (!qobuzAppId) return res.status(400).json({ error: 'QOBUZ_APP_ID not configured.' });\n  const { playlist_id, limit, offset } = req.query;\n  try {\n    const params: any = { playlist_id, extra: 'tracks' };\n    if (limit) params.limit = limit;\n    if (offset) params.offset = offset;\n    const response = await axios.get(`${qobuzApiBase}playlist/get`, {\n      params,"
);

fs.writeFileSync('server.ts', serverCode);
