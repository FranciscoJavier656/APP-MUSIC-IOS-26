const axios = require('axios');
async function test() {
  try {
    const res = await axios.get('http://localhost:3000/api/featured?type=most-streamed');
    console.log("most-streamed:", res.data.albums.items.length);
  } catch(e) { console.log(e.response ? e.response.data : e.message); }
  
  try {
    const res = await axios.get('http://localhost:3000/api/playlists');
    console.log("playlists:", res.data.playlists.items.length);
  } catch(e) { console.log(e.response ? e.response.data : e.message); }
}
test();
