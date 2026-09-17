const axios = require('axios');
require('dotenv').config();
const qobuzAppId = process.env.QOBUZ_APP_ID;
const qobuzToken = process.env.QOBUZ_USER_AUTH_TOKEN;

async function run() {
  try {
    const searchRes = await axios.get('https://www.qobuz.com/api.json/0.2/catalog/search', {
      params: { query: 'Don Omar', limit: 5, offset: 0 },
      headers: { 'x-app-id': qobuzAppId, 'x-user-auth-token': qobuzToken }
    });
    console.log("Search total tracks:", searchRes.data.tracks.total);
    console.log("Search limit 5 returned:", searchRes.data.tracks.items.length);
  } catch (e) {
    console.error(e.response?.data || e.message);
  }
}
run();
