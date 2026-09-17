const axios = require('axios');
require('dotenv').config();
const qobuzAppId = process.env.QOBUZ_APP_ID;
const qobuzToken = process.env.VITE_QOBUZ_USER_TOKEN;

async function run() {
  try {
    const res = await axios.get('https://www.qobuz.com/api.json/0.2/album/get', {
      params: { album_id: '0002894791054' }, // A random big album if possible
      headers: { 'x-app-id': qobuzAppId }
    });
    console.log("Album tracks:", res.data.tracks?.items?.length, res.data.tracks_count);
  } catch (e) {
    console.log(e.message, e.response?.data);
  }
}
run();
