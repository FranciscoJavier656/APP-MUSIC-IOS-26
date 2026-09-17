const axios = require('axios');
require('dotenv').config();
const qobuzAppId = process.env.QOBUZ_APP_ID;

async function run() {
  try {
    // 1. Search Pagination
    console.log("--- Search Pagination ---");
    const searchRes = await axios.get('https://www.qobuz.com/api.json/0.2/catalog/search', {
      params: { query: 'Don Omar', type: 'tracks', limit: 5, offset: 0 },
      headers: { 'x-app-id': qobuzAppId }
    });
    console.log("Search total tracks:", searchRes.data.tracks.total);
    console.log("Search limit 5 returned:", searchRes.data.tracks.items.length);

    // 2. Artist Get
    console.log("--- Artist Get ---");
    // Get Don Omar artist ID
    const artistId = searchRes.data.tracks.items[0].performer.id;
    const artistRes = await axios.get('https://www.qobuz.com/api.json/0.2/artist/get', {
      params: { artist_id: artistId, extra: 'tracks,albums', limit: 10, offset: 0 },
      headers: { 'x-app-id': qobuzAppId }
    });
    console.log("Artist tracks count:", artistRes.data.tracks?.items?.length);
    console.log("Artist albums count:", artistRes.data.albums?.items?.length);
  } catch (e) {
    console.error(e.response?.data || e.message);
  }
}
run();
