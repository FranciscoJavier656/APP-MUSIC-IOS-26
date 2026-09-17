const axios = require('axios');
require('dotenv').config();
const qobuzAppId = process.env.QOBUZ_APP_ID;
const qobuzToken = process.env.VITE_QOBUZ_USER_TOKEN;

async function run() {
  try {
    const artistId = 239088; // Don Omar
    const res = await axios.get('https://www.qobuz.com/api.json/0.2/artist/get', {
      params: { artist_id: artistId, extra: 'tracks', limit: 50 },
      headers: { 'x-app-id': qobuzAppId }
    });
    console.log("Without token, Limit 50 tracks:", res.data.tracks?.items?.length, res.data.tracks?.total);
  } catch (e) {
    console.error(e.response?.data || e.message);
  }
}
run();
