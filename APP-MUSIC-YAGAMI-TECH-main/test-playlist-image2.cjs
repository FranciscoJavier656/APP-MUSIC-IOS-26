const axios = require('axios');
async function test() {
  try {
    const res = await axios.get('http://localhost:3000/api/playlists');
    console.log(JSON.stringify(res.data.playlists.items.slice(0, 3).map(p => ({
        name: p.name, 
        image_square: p.image_square, 
        images: p.images ? p.images.length : 0,
        images300: p.images300 ? p.images300.length : 0
    })), null, 2));
  } catch(e) { console.log(e.message); }
}
test();
