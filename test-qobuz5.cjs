require('dotenv').config({ path: '.env.local' });
require('dotenv').config();
const axios = require('axios');
async function test() {
  const appId = process.env.VITE_QOBUZ_APP_ID;
  const token = process.env.VITE_QOBUZ_USER_TOKEN;
  try {
    const res = await axios.get('https://www.qobuz.com/api.json/0.2/catalog/search', {
      headers: { 'x-app-id': appId, 'x-user-auth-token': token },
      params: { query: 'Top Albums', limit: 10 }
    });
    console.log("Albums:", res.data.albums.items.length);
  } catch(e) {
    console.log("Error:", e.response ? e.response.status : e.message);
  }
}
test();
