const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

code = code.replace(
  "const response = await axios.get(`${qobuzApiBase}album/get`, {\n      headers: {",
  "const response = await axios.get(`${qobuzApiBase}album/get`, {\n      params: { album_id },\n      headers: {"
);

fs.writeFileSync('server.ts', code);
