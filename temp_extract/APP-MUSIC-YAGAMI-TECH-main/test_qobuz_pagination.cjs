const axios = require('axios');
require('dotenv').config();
const qobuzAppId = process.env.QOBUZ_APP_ID;
const qobuzToken = process.env.VITE_QOBUZ_USER_TOKEN;

async function run() {
  try {
    const searchRes = await axios.get('https://www.qobuz.com/api.json/0.2/catalog/search', {
      params: { query: 'Don Omar', limit: 2, offset: 0 },
      headers: { 'x-app-id': qobuzAppId }
    });
    console.log("Search Page 1:", searchRes.data.tracks?.items?.length, searchRes.data.tracks?.total);
    
    const searchRes2 = await axios.get('https://www.qobuz.com/api.json/0.2/catalog/search', {
      params: { query: 'Don Omar', limit: 2, offset: 2 },
      headers: { 'x-app-id': qobuzAppId }
    });
    console.log("Search Page 2:", searchRes2.data.tracks?.items?.length, searchRes2.data.tracks?.total);
    
    const artistRes = await axios.get('https://www.qobuz.com/api.json/0.2/artist/get', {
      params: { artist_id: 239088, extra: 'tracks', limit: 2, offset: 0 },
      headers: { 'x-app-id': qobuzAppId }
    });
    console.log("Artist Page 1:", artistRes.data.tracks?.items?.length, artistRes.data.tracks?.total);
  } catch (e) {
    console.log(e.message, e.response?.data);
  }
}
run();
