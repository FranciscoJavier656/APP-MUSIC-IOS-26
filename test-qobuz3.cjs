require('dotenv').config({ path: '.env.local' });
require('dotenv').config();
const axios = require('axios');

async function test() {
  const appId = process.env.VITE_QOBUZ_APP_ID;
  try {
    const res = await axios.get('https://www.qobuz.com/api.json/0.2/playlist/getFeatured', {
      headers: { 'x-app-id': appId },
      params: { limit: 5 }
    });
    console.log("Success:", Object.keys(res.data));
  } catch(e) {
    console.log("Error:", e.response ? e.response.status : e.message, e.response ? e.response.data : '');
  }
}
test();
