const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');
code = code.replace(
  '<nav className="absolute bottom-0 left-0 w-full h-[72px]', 
  '// Removing old nav layout\n{/* <nav className="absolute bottom-0 left-0 w-full h-[72px]'
);
fs.writeFileSync('src/App.tsx', code);
