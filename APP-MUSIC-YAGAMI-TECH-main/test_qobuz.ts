import dotenv from 'dotenv';
dotenv.config();
import axios from 'axios';

async function run() {
  const qobuzAppId = process.env.QOBUZ_APP_ID || '';
  const qobuzToken = JSON.parse(process.env.QOBUZ_AUTH_TOKENS || '[]')[0];
  const headers = { 'x-app-id': qobuzAppId, 'x-user-auth-token': qobuzToken || undefined };
  const track_id = 6992739;

  const endpoints = ['track/lyrics', 'lyrics/get', 'track/getSyncLyrics', 'track/getLyrics'];
  for (const ep of endpoints) {
    try {
      const res = await axios.get(`https://www.qobuz.com/api.json/0.2/${ep}?track_id=${track_id}`, { headers });
      console.log(`Success with ${ep}:`, res.data);
    } catch (e) {
      console.log(`${ep} failed:`, e.response?.data?.message);
    }
  }
}
run();
