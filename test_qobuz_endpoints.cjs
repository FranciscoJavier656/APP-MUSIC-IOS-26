const axios = require('axios');
const qobuzAppId = "100000000"; // not real, I'll use localhost:3000 to proxy

async function run() {
  try {
    console.log("Testing catalog/search with offset=10...");
    const res1 = await axios.get('http://localhost:3000/api/search?q=Don%20Omar&limit=10&offset=10');
    console.log("Result 1:", res1.data.tracks?.items?.[0]?.id);
    
  } catch (e) {
    console.error(e.response ? e.response.data : e.message);
  }
}
run();
