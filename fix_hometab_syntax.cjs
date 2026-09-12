const fs = require('fs');
let code = fs.readFileSync('src/components/HomeTab.tsx', 'utf8');

code = code.replace(
  /                  <\/div>\s*<\/>\s*\)\}\s*<\/div>\s*\) : \(\s*<div className="h-full">/m,
  "I shouldn't do regex like this"
);

// A better way is to just restore the file and patch it with exact lines
