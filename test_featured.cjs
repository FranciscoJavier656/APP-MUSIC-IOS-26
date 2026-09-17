const axios = require('axios');
async function run() {
  try {
    const res = await axios.get('http://localhost:3000/api/featured');
    console.log(res.data.albums?.items?.length || 0, 'featured albums');
  } catch(e) {
    console.error(e.response?.data || e.message);
  }
}
run();
