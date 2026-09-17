require('dotenv').config({ path: '.env.local' });
require('dotenv').config();
const axios = require('axios');
async function test() {
  const appId = process.env.VITE_QOBUZ_APP_ID;
  const token = process.env.VITE_QOBUZ_USER_TOKEN;
  const headers = { 'x-app-id': appId, 'x-user-auth-token': token };
  
  try {
    const res1 = await axios.get('https://www.qobuz.com/api.json/0.2/album/getFeatured', {
      headers, params: { type: 'editor-picks', limit: 2, country: 'MX' }
    });
    console.log("editor-picks albums:", res1.data.albums.items.length);
    
    const res2 = await axios.get('https://www.qobuz.com/api.json/0.2/playlist/getFeatured', {
      headers, params: { type: 'editor-picks', limit: 2, country: 'MX' }
    });
    console.log("editor-picks playlists:", res2.data.playlists.items.length);

    const res3 = await axios.get('https://www.qobuz.com/api.json/0.2/album/getFeatured', {
      headers, params: { type: 'most-streamed', limit: 2, country: 'MX' }
    });
    console.log("most-streamed albums:", res3.data.albums.items.length);

  } catch(e) {
    console.log("Error:", e.response ? e.response.status + ' ' + JSON.stringify(e.response.data) : e.message);
  }
}
test();
