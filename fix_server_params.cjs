const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

code = code.replace(
  "const url = `${qobuzApiBase}catalog/search`;\n    const response = await axios.get(url, {\n      headers: {",
  "const url = `${qobuzApiBase}catalog/search`;\n    const response = await axios.get(url, {\n      params: { query, limit, offset },\n      headers: {"
);

code = code.replace(
  "const response = await axios.get(`${qobuzApiBase}album/getFeatured`, {\n      headers: {",
  "const response = await axios.get(`${qobuzApiBase}album/getFeatured`, {\n      params: { type, limit: 15 },\n      headers: {"
);

code = code.replace(
  "const response = await axios.get(`${qobuzApiBase}playlist/getFeatured`, {\n      headers: {",
  "const response = await axios.get(`${qobuzApiBase}playlist/getFeatured`, {\n      params: { type: 'editor-picks', limit: 15 },\n      headers: {"
);

fs.writeFileSync('server.ts', code);
