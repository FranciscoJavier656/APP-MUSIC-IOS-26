const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

// Update /api/search
code = code.replace(
  "app.get('/api/search', async (req, res) => {\n  const { q } = req.query;\n  if (!q) {\n    return res.status(400).json({ error: 'Query is required' });\n  }\n  const results = await qobuzSearch(q as string, parseInt(req.query.limit as string) || 50);\n  res.json(results);\n});",
  "app.get('/api/search', async (req, res) => {\n  const { q, limit, offset } = req.query;\n  if (!q) {\n    return res.status(400).json({ error: 'Query is required' });\n  }\n  const results = await qobuzSearch(q as string, parseInt(limit as string) || 50, parseInt(offset as string) || 0);\n  res.json(results);\n});"
);

// Update /api/artist
code = code.replace(
  "app.get('/api/artist', async (req, res) => {\n  if (!qobuzAppId) return res.status(400).json({ error: 'QOBUZ_APP_ID not configured.' });\n  const { artist_id } = req.query;\n  try {\n    const response = await axios.get(`${qobuzApiBase}artist/get`, {\n      params: { artist_id, extra: 'albums,tracks' },",
  "app.get('/api/artist', async (req, res) => {\n  if (!qobuzAppId) return res.status(400).json({ error: 'QOBUZ_APP_ID not configured.' });\n  const { artist_id, limit, offset } = req.query;\n  try {\n    const response = await axios.get(`${qobuzApiBase}artist/get`, {\n      params: { artist_id, extra: 'albums,tracks', limit: limit || 50, offset: offset || 0 },"
);

fs.writeFileSync('server.ts', code);
