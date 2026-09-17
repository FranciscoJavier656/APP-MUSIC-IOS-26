const axios = require('axios');
require('dotenv').config();
const qobuzAppId = process.env.QOBUZ_APP_ID;
const qobuzToken = process.env.QOBUZ_USER_AUTH_TOKEN;

async function run() {
  try {
    const artistId = 239088; // Don Omar probably? Let's search first if not found
    const artistRes = await axios.get('https://www.qobuz.com/api.json/0.2/artist/get', {
      params: { artist_id: artistId, extra: 'tracks', limit: 100 },
      headers: { 'x-app-id': qobuzAppId, 'x-user-auth-token': qobuzToken }
    });
    console.log("Artist tracks returned with limit 100:", artistRes.data.tracks?.items?.length);
    console.log("Total tracks:", artistRes.data.tracks?.total);
  } catch (e) {
    console.error(e.response?.data || e.message);
  }
}
run();
