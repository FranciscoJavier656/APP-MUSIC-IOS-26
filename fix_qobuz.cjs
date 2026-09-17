const fs = require('fs');
let code = fs.readFileSync('src/lib/qobuz.ts', 'utf8');

code = code.replace(
  /export const getFeaturedAlbums = async \(type: string = 'new-releases', genre_id\?: string\) => \{/,
  "export const getFeaturedAlbums = async (type: string = 'new-releases', genre_id?: string, limit?: number) => {"
);
code = code.replace(
  /params: \{ type, limit: 15, \.\.\.\(genre_id \? \{ genre_id \} : \{\}\) \},/g,
  "params: { type, limit: limit || 15, ...(genre_id ? { genre_id } : {}) },"
);
code = code.replace(
  /const res = await axios\.get\(`\/api\/featured`, \{ params: \{ type, \.\.\.\(genre_id \? \{ genre_id \} : \{\}\) \} \}\);/g,
  "const res = await axios.get(`/api/featured`, { params: { type, limit: limit || 15, ...(genre_id ? { genre_id } : {}) } });"
);

fs.writeFileSync('src/lib/qobuz.ts', code);
