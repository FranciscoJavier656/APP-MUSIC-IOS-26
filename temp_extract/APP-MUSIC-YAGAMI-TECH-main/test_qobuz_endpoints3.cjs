const axios = require('axios');
require('dotenv').config();
const qobuzAppId = process.env.QOBUZ_APP_ID;

async function run() {
  try {
    const res1 = await axios.get('https://www.qobuz.com/api.json/0.2/catalog/search', {
      params: { query: 'Don Omar', limit: 10, offset: 0 },
      headers: { 'x-app-id': qobuzAppId }
    });
    console.log("Without type - offset=0:", res1.data.tracks?.items?.[0]?.id);

    const res2 = await axios.get('https://www.qobuz.com/api.json/0.2/catalog/search', {
      params: { query: 'Don Omar', limit: 10, offset: 10 },
      headers: { 'x-app-id': qobuzAppId }
    });
    console.log("Without type - offset=10:", res2.data.tracks?.items?.[0]?.id);

  } catch (e) {
    console.error(e.response ? e.response.data : e.message);
  }
}
run();
