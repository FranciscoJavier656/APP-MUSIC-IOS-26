const axios = require('axios');
async function run() {
  try {
    const res1 = await axios.get('http://localhost:3000/api/artist?artist_id=324907&limit=10&offset=0');
    console.log("Artist Page 1:", res1.data.tracks?.items?.[0]?.id);
    
    const res2 = await axios.get('http://localhost:3000/api/artist?artist_id=324907&limit=10&offset=10');
    console.log("Artist Page 2:", res2.data.tracks?.items?.[0]?.id);
  } catch (e) {
    console.error(e.response ? e.response.data : e.message);
  }
}
run();
