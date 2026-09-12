const axios = require('axios');
async function test() {
  try {
    const res = await axios.get('http://localhost:3000/api/playlist?playlist_id=68995736');
    console.log(res.data.name, res.data.tracks.items.length);
  } catch(e) { console.log(e.response ? e.response.data : e.message); }
}
test();
