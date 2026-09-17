const axios = require('axios');
async function run() {
  try {
    const res = await axios.get('http://localhost:3000/api/playlists');
    console.log(res.data);
  } catch(e) {
    console.error(e.response?.data || e.message);
  }
}
run();
