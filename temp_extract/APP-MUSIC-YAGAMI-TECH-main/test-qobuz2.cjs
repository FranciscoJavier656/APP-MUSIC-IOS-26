require('dotenv').config({ path: '.env.local' });
require('dotenv').config();
const axios = require('axios');

async function test() {
  const appId = process.env.VITE_QOBUZ_APP_ID;
  const token = process.env.VITE_QOBUZ_USER_TOKEN;
  console.log("App ID:", appId ? "found" : "missing", "Token:", token ? "found" : "missing");
  try {
    const res = await axios.get('https://www.qobuz.com/api.json/0.2/album/getFeatured', {
      headers: { 'x-app-id': appId, 'x-user-auth-token': token },
      params: { type: 'new-releases', limit: 5 }
    });
    console.log("Success:", Object.keys(res.data));
    console.log(res.data.albums.items[0].title);
  } catch(e) {
    console.log("Error:", e.response ? e.response.status : e.message, e.response ? e.response.data : '');
  }
}
test();
