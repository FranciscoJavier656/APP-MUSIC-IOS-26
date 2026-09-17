const axios = require('axios');
async function run() {
  try {
    const res = await axios.get('http://localhost:3000/api/stream?track_id=102377317');
    console.log(res.data);
  } catch(e) {
    console.error(e.response?.data || e.message);
  }
}
run();
