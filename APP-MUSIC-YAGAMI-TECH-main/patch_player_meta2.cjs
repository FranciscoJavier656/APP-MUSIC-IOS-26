const fs = require('fs');
let code = fs.readFileSync('src/components/PlayerContext.tsx', 'utf8');

code = code.replace(
    /\{\s*src: currentTrack\.image,\s*sizes: "1024x1024"/g,
    "{ src: getImageSrc(currentTrack.image) || \"\", sizes: \"1024x1024\""
);

fs.writeFileSync('src/components/PlayerContext.tsx', code);
