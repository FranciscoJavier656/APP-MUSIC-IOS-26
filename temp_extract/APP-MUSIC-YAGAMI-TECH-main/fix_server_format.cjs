const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const oldApiStream = `app.get('/api/stream', async (req, res) => {
  const { track_id } = req.query;
  if (!track_id) return res.status(400).json({ error: 'track_id is required' });
  if (!qobuzAppId || !qobuzSecret) return res.status(400).json({ error: 'Qobuz credentials not configured' });

  try {
    const quality = '27'; // FLAC or high-res, but browser might only support some formats. Actually 27 is mp3/flac, 5 is mp3 320. Let's use 5 (mp3 320) for web preview compatibility.
    const timestamp = Math.floor(Date.now() / 1000);
    const r_sig = \`trackgetFileUrlformat_id\${5}intentstreamtrack_id\${track_id}\${timestamp}\${qobuzSecret}\`;
    const r_sig_hashed = crypto.createHash('md5').update(r_sig).digest('hex');

    const response = await axios.get(\`\${qobuzApiBase}track/getFileUrl\`, {
      params: {
        format_id: 5,
        intent: 'stream',
        track_id: track_id,
        request_ts: timestamp,
        request_sig: r_sig_hashed
      },`;

const newApiStream = `app.get('/api/stream', async (req, res) => {
  const { track_id, format_id = '5' } = req.query;
  if (!track_id) return res.status(400).json({ error: 'track_id is required' });
  if (!qobuzAppId || !qobuzSecret) return res.status(400).json({ error: 'Qobuz credentials not configured' });

  try {
    const timestamp = Math.floor(Date.now() / 1000);
    const r_sig = \`trackgetFileUrlformat_id\${format_id}intentstreamtrack_id\${track_id}\${timestamp}\${qobuzSecret}\`;
    const r_sig_hashed = crypto.createHash('md5').update(r_sig).digest('hex');

    const response = await axios.get(\`\${qobuzApiBase}track/getFileUrl\`, {
      params: {
        format_id: format_id,
        intent: 'stream',
        track_id: track_id,
        request_ts: timestamp,
        request_sig: r_sig_hashed
      },`;

if (code.includes(oldApiStream)) {
    code = code.replace(oldApiStream, newApiStream);
    fs.writeFileSync('server.ts', code);
    console.log('Fixed server.ts');
} else {
    console.log('Could not find old string in server.ts');
}
