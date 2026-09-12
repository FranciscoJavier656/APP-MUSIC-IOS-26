const axios = require('axios');
require('dotenv').config();
const qobuzAppId = process.env.QOBUZ_APP_ID;
const qobuzToken = process.env.QOBUZ_USER_AUTH_TOKEN;

async function run() {
  // Try to get a popular playlist
  const featured = await axios.get('https://www.qobuz.com/api.json/0.2/playlist/getFeatured?type=editor-picks&limit=1', {
    headers: { 'x-app-id': qobuzAppId }
  });
  const pid = featured.data.playlists.items[0].id;
  
  const p1 = await axios.get(`https://www.qobuz.com/api.json/0.2/playlist/get?playlist_id=${pid}&extra=tracks&limit=5&offset=5`, {
    headers: { 'x-app-id': qobuzAppId }
  });
  console.log("Tracks returned:", p1.data.tracks.items.length, "Total:", p1.data.tracks.total);
}
run().catch(console.error);
