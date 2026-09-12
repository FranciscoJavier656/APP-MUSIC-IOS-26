const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

code = code.replace(
  "async function qobuzSearch(query: string, limit = 50, offset = 0) {\n  if (!qobuzAppId) return { error: 'QOBUZ_APP_ID not configured.' };\n  \n  try {\n    const url = `${qobuzApiBase}catalog/search`;\n    const response = await axios.get(url, {",
  "async function qobuzSearch(query: string, limit = 50, offset = 0, type?: string) {\n  if (!qobuzAppId) return { error: 'QOBUZ_APP_ID not configured.' };\n  \n  try {\n    let url = `${qobuzApiBase}catalog/search`;\n    if (type === 'tracks') url = `${qobuzApiBase}track/search`;\n    if (type === 'albums') url = `${qobuzApiBase}album/search`;\n    if (type === 'artists') url = `${qobuzApiBase}artist/search`;\n    if (type === 'playlists') url = `${qobuzApiBase}playlist/search`;\n    const response = await axios.get(url, {"
);

code = code.replace(
  "app.get('/api/search', async (req, res) => {\n  const { q, limit, offset } = req.query;\n  if (!q) {\n    return res.status(400).json({ error: 'Query is required' });\n  }\n  const results = await qobuzSearch(q as string, parseInt(limit as string) || 50, parseInt(offset as string) || 0);\n  res.json(results);\n});",
  "app.get('/api/search', async (req, res) => {\n  const { q, limit, offset, type } = req.query;\n  if (!q) {\n    return res.status(400).json({ error: 'Query is required' });\n  }\n  const results = await qobuzSearch(q as string, parseInt(limit as string) || 50, parseInt(offset as string) || 0, type as string);\n  res.json(results);\n});"
);

fs.writeFileSync('server.ts', code);
