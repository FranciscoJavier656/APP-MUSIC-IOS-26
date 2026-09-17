const axios = require('axios');
async function run() {
  try {
    const res = await axios.get('http://localhost:3000/api/playlist?playlist_id=13511417');
    console.log(res.data.tracks?.items?.length, 'tracks');
  } catch(e) {
    console.error(e.response?.data || e.message);
  }
}
run();
