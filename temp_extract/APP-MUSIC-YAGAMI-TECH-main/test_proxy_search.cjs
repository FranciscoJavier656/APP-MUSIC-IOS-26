const axios = require('axios');
async function run() {
  try {
    const res1 = await axios.get('http://localhost:3000/api/search?q=Don%20Omar&limit=10&offset=0');
    console.log("Page 1 first ID:", res1.data.tracks?.items?.[0]?.id);

    const res2 = await axios.get('http://localhost:3000/api/search?q=Don%20Omar&limit=10&offset=10');
    console.log("Page 2 first ID:", res2.data.tracks?.items?.[0]?.id);
  } catch (e) {
    console.error(e.response ? e.response.data : e.message);
  }
}
run();
