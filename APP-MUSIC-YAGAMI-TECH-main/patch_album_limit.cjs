const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

code = code.replace(
  "app.get('/api/album', async (req, res) => {\n  const { album_id } = req.query;\n  if (!album_id) return res.status(400).json({ error: 'album_id is required' });\n  if (!qobuzAppId) return res.status(400).json({ error: 'Qobuz credentials not configured' });\n  try {\n    const response = await axios.get(`${qobuzApiBase}album/get`, {\n      params: { album_id },",
  "app.get('/api/album', async (req, res) => {\n  const { album_id } = req.query;\n  if (!album_id) return res.status(400).json({ error: 'album_id is required' });\n  if (!qobuzAppId) return res.status(400).json({ error: 'Qobuz credentials not configured' });\n  try {\n    const response = await axios.get(`${qobuzApiBase}album/get`, {\n      params: { album_id, limit: 500 }, // Fetch up to 500 tracks to avoid truncation"
);

fs.writeFileSync('server.ts', code);
