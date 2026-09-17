const fs = require('fs');
let code = fs.readFileSync('src/components/PlayerContext.tsx', 'utf8');

// 1. Add import for getImageSrc if not exists
if (!code.includes("getImageSrc")) {
    code = code.replace(/import \{ Capacitor \} from "@capacitor\/core";/, "import { Capacitor } from \"@capacitor/core\";\nimport { getImageSrc } from \"../lib/image\";");
}

// 2. Fix MediaMetadata artwork
code = code.replace(
    /artwork: currentTrack\.image\n\s*\?\s*\[\n\s*\{\n\s*src: currentTrack\.image,/g,
    "artwork: currentTrack.image ? [{ src: getImageSrc(currentTrack.image) || \"\","
);

// 3. Fix QobuzAudio.updateMetadata coverUrl
code = code.replace(
    /coverUrl: track\.image \|\| "",/g,
    "coverUrl: getImageSrc(track.image) || \"\","
);

fs.writeFileSync('src/components/PlayerContext.tsx', code);
console.log("Patched PlayerContext.tsx for image metadata");
