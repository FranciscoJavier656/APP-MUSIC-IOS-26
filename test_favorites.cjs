const axios = require('axios');
axios.get('http://localhost:3000/api/favorites?type=albums&limit=2')
  .then(res => {
     console.log("Favorites:", JSON.stringify(res.data, null, 2));
  })
  .catch(e => console.log(e.message));
