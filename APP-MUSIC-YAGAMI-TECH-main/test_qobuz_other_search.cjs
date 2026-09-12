const axios = require('axios');
require('dotenv').config();
const qobuzAppId = process.env.QOBUZ_APP_ID;
let qobuzToken = JSON.parse(process.env.VITE_QOBUZ_USER_TOKEN || '[]')[0];

async function run() {
  try {
    const res1 = await axios.get('https://www.qobuz.com/api.json/0.2/album/search', {
      params: { query: 'Don Omar', limit: 2, offset: 0 },
      headers: { 'x-app-id': qobuzAppId, 'x-user-auth-token': qobuzToken }
    });
    console.log("Album Search Page 1:", res1.data.albums?.items?.[0]?.id);

    const res2 = await axios.get('https://www.qobuz.com/api.json/0.2/album/search', {
      params: { query: 'Don Omar', limit: 2, offset: 2 },
      headers: { 'x-app-id': qobuzAppId, 'x-user-auth-token': qobuzToken }
    });
    console.log("Album Search Page 2:", res2.data.albums?.items?.[0]?.id);
  } catch (e) {
    console.error(e.response ? e.response.data : e.message);
  }
}
run();
