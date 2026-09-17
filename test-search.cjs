const axios = require('axios');
async function test() {
  try {
    const res = await axios.get('http://localhost:3000/api/search?q=Karaoke%20Reggaeton');
    console.log(Object.keys(res.data));
    console.log(res.data.playlists ? res.data.playlists.items.length : 0);
    console.log(res.data.albums ? res.data.albums.items.length : 0);
  } catch(e) { console.log(e.message); }
}
test();
