const axios = require('axios');
async function run() {
  try {
    const res = await axios.get('http://localhost:3000/api/playlist?playlist_id=7802330');
    console.log(res.data.tracks?.items?.slice(0, 5).map(t => t.id));
  } catch(e) {
    console.error(e.response?.data || e.message);
  }
}
run();
