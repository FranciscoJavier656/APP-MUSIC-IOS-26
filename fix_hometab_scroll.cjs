const fs = require('fs');
let code = fs.readFileSync('src/components/HomeTab.tsx', 'utf8');

code = code.replace(
  /className="fixed inset-0 z-50 bg-\[#F2F2F7\] dark:bg-\[#000000\] overflow-y-auto"/g,
  'className="fixed inset-0 z-50 bg-[#F2F2F7] dark:bg-[#000000]"'
);

fs.writeFileSync('src/components/HomeTab.tsx', code);
