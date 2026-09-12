const axios = require('axios');
async function test() {
  try {
    const res = await axios.get('http://localhost:3000/api/playlist?playlist_id=68995736');
    console.log(JSON.stringify(res.data, null, 2));
  } catch(e) { console.log(e.response ? e.response.data : e.message); }
}
test();
