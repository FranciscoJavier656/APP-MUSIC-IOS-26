const axios = require('axios');
async function run() {
  try {
    const res = await axios.get('http://localhost:3000/api/search?q=Mix');
    console.log(res.data.playlists?.items?.map(p => ({ id: p.id, name: p.name })).slice(0, 5));
  } catch(e) {
    console.error(e.response?.data || e.message);
  }
}
run();
