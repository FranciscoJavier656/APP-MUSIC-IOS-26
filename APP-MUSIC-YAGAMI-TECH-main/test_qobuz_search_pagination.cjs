const axios = require('axios');
require('dotenv').config();
const qobuzAppId = process.env.QOBUZ_APP_ID;
const qobuzToken = process.env.VITE_QOBUZ_USER_TOKEN;

async function run() {
  try {
    const res1 = await axios.get('https://www.qobuz.com/api.json/0.2/catalog/search', {
      params: { query: 'Don Omar', limit: 10, offset: 0 },
      headers: { 'x-app-id': qobuzAppId, 'x-user-auth-token': qobuzToken }
    });
    console.log("Page 1 first track:", res1.data.tracks?.items?.[0]?.title);
    console.log("Page 1 length:", res1.data.tracks?.items?.length);

    const res2 = await axios.get('https://www.qobuz.com/api.json/0.2/catalog/search', {
      params: { query: 'Don Omar', limit: 10, offset: 10 },
      headers: { 'x-app-id': qobuzAppId, 'x-user-auth-token': qobuzToken }
    });
    console.log("Page 2 first track:", res2.data.tracks?.items?.[0]?.title);
    console.log("Page 2 length:", res2.data.tracks?.items?.length);
  } catch (e) {
    console.error(e.message);
  }
}
run();
