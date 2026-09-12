const fs = require('fs');
let code = fs.readFileSync('src/components/ArtistView.tsx', 'utf8');

code = code.replace(
  'if (!artist) return null;',
  'if (!artist) return <div ref={containerRef} className="h-full w-full bg-[#F2F2F7] dark:bg-[#000000]" />;'
);

fs.writeFileSync('src/components/ArtistView.tsx', code);
