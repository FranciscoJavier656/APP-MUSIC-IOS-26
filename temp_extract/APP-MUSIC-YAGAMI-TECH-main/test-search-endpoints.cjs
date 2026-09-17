const axios = require('axios');
async function test() {
  try {
    const res = await axios.get('http://localhost:3000/api/search?q=Karaoke%20Reggaeton');
    console.log(res.data.playlists?.items?.length || 0, 'playlists');
    console.log(res.data.albums?.items?.length || 0, 'albums');
  } catch(e) { console.log(e.response?.data || e.message); }
}
test();
