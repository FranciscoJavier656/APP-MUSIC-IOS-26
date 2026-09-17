const fs = require('fs');
let code = fs.readFileSync('src/components/ArtistView.tsx', 'utf8');

code = code.replace(
  '<div className="h-full w-full bg-[#F2F2F7] dark:bg-[#000000] flex items-center justify-center">',
  '<div ref={containerRef} className="h-full w-full bg-[#F2F2F7] dark:bg-[#000000] flex items-center justify-center">'
);

code = code.replace(
  '<div className="h-full w-full bg-[#F2F2F7] dark:bg-[#000000] flex flex-col items-center justify-center p-6 text-center">',
  '<div ref={containerRef} className="h-full w-full bg-[#F2F2F7] dark:bg-[#000000] flex flex-col items-center justify-center p-6 text-center">'
);

fs.writeFileSync('src/components/ArtistView.tsx', code);
