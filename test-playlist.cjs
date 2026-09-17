const axios = require('axios');
async function test() {
  try {
    const res = await axios.get('https://www.qobuz.com/api.json/0.2/playlist/get', {
      params: { playlist_id: '68995736', extra: 'tracks' },
      headers: { 'x-app-id': '941655092' }
    });
    console.log(res.data.name, res.data.tracks.items.length);
  } catch(e) { console.log(e.response ? e.response.data : e.message); }
}
test();
