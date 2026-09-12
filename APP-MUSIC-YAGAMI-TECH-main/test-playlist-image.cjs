const axios = require('axios');
async function test() {
  try {
    const res = await axios.get('http://localhost:3000/api/playlists');
    console.log(JSON.stringify(res.data.playlists.items[0], null, 2));
  } catch(e) { console.log(e.message); }
}
test();
