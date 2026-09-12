const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

code = code.replace(
  "      params: { artist_id, extra: 'albums,tracks', limit: limit || 50, offset: offset || 0 },",
  "      params: { artist_id, extra: 'albums,tracks', limit: 200, offset: 0 }, // Fetch all we can"
);

fs.writeFileSync('server.ts', code);
