const fs = require('fs');
let code = fs.readFileSync('src/components/ExpandedPlayer.tsx', 'utf8');

code = code.replace(
  'className="relative w-full max-w-[320px] sm:max-w-[400px] aspect-square rounded-3xl',
  'className="relative h-full max-h-[320px] sm:max-h-[400px] aspect-square rounded-3xl'
);

fs.writeFileSync('src/components/ExpandedPlayer.tsx', code);
