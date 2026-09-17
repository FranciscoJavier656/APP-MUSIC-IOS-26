const fs = require('fs');

// 1. Update server.ts
let serverCode = fs.readFileSync('server.ts', 'utf8');
const newRoute = `
app.get('/api/artist', async (req, res) => {
  if (!qobuzAppId) return res.status(400).json({ error: 'QOBUZ_APP_ID not configured.' });
  const { artist_id } = req.query;
  try {
    const response = await axios.get(\`\${qobuzApiBase}artist/get\`, {
      params: { artist_id, extra: 'albums,tracks' },
      headers: {
        'x-app-id': qobuzAppId,
        'x-user-auth-token': qobuzToken || undefined,
      },
    });
    res.json(response.data);
  } catch (error: any) {
    console.error('Qobuz artist error:', error?.response?.data || error.message);
    res.status(500).json({ error: 'Failed to get artist', details: error?.response?.data });
  }
});

app.get('/api/playlist', async (req, res) => {`;

serverCode = serverCode.replace("app.get('/api/playlist', async (req, res) => {", newRoute);
fs.writeFileSync('server.ts', serverCode);

// 2. Update qobuz.ts
let qobuzCode = fs.readFileSync('src/lib/qobuz.ts', 'utf8');
const newFn = `
export const getQobuzArtist = async (artistId: string) => {
  if (Capacitor.isNativePlatform()) {
    const res = await axios.get(\`\${QOBUZ_API}artist/get\`, {
      params: { artist_id: artistId, extra: 'albums,tracks' },
      headers: { 'x-app-id': qobuzAppId, 'x-user-auth-token': qobuzToken || undefined }
    });
    return res.data;
  }
  const res = await axios.get(\`/api/artist\`, { params: { artist_id: artistId } });
  if (res.data.error) throw new Error(res.data.error);
  return res.data;
};
`;
qobuzCode += newFn;
fs.writeFileSync('src/lib/qobuz.ts', qobuzCode);
