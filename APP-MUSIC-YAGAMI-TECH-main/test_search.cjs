const axios = require('axios');
const app_id = process.env.VITE_QOBUZ_APP_ID;
let token = process.env.VITE_QOBUZ_USER_TOKEN;
try {
  const tokens = JSON.parse(token);
  token = tokens[0];
} catch(e) {}

async function run() {
  try {
    const res = await axios.get(`https://www.qobuz.com/api.json/0.2/catalog/search`, {
      params: { query: 'Billie Jean', limit: 1, app_id, user_auth_token: token }
    });
    console.log("Track ID:", res.data.tracks.items[0].id);
    console.log("Streamable:", res.data.tracks.items[0].streamable);
    console.log("Downloadable:", res.data.tracks.items[0].downloadable);
  } catch (e) {
    console.error("Error:", e.response ? e.response.data : e.message);
  }
}
run();
