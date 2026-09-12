require('dotenv').config({ path: '.env.local' });
require('dotenv').config();
const axios = require('axios');

async function test() {
  const appId = process.env.VITE_QOBUZ_APP_ID;
  console.log("App ID:", appId ? "found" : "missing");
  try {
    const res = await axios.get('https://www.qobuz.com/api.json/0.2/album/getFeatured', {
      headers: { 'x-app-id': appId },
      params: { type: 'new-releases', genre_id: '', limit: 5 }
    });
    console.log("Success:", Object.keys(res.data));
  } catch(e) {
    console.log("Error:", e.response ? e.response.status : e.message, e.response ? e.response.data : '');
  }
}
test();
