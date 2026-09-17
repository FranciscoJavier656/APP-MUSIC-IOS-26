const axios = require('axios');
require('dotenv').config();
const qobuzAppId = process.env.QOBUZ_APP_ID;
const qobuzToken = process.env.QOBUZ_USER_AUTH_TOKEN;

async function run() {
  const p1 = await axios.get(`https://www.qobuz.com/api.json/0.2/playlist/get?playlist_id=14187640&extra=tracks&limit=5&offset=5`, {
    headers: { 'x-app-id': qobuzAppId, 'x-user-auth-token': qobuzToken }
  });
  console.log("Limit 5 Offset 5 tracks:", p1.data.tracks.items.length);
  const p2 = await axios.get(`https://www.qobuz.com/api.json/0.2/playlist/get?playlist_id=14187640&extra=tracks&limit=10&offset=0`, {
    headers: { 'x-app-id': qobuzAppId, 'x-user-auth-token': qobuzToken }
  });
  console.log("Limit 10 Offset 0 tracks:", p2.data.tracks.items.length);
}
run().catch(console.error);
