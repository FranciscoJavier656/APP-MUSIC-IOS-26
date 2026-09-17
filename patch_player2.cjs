const fs = require('fs');
let code = fs.readFileSync('src/components/PlayerContext.tsx', 'utf8');

const target1 = `    try {
      let streamUrl = track.streamUrl || "";
      
      const lp = track.localPath || track.local_path || (track.original && (track.original.localPath || track.original.local_path));`;
      
const replacement1 = `    try {
      let streamUrl = track.streamUrl || "";
      let finalCoverUrl = getImageSrc(track.image) || "";
      
      const lp = track.localPath || track.local_path || (track.original && (track.original.localPath || track.original.local_path));
      const localCover = track.localCoverPath || (track.original && track.original.localCoverPath);
      
      if (localCover && Capacitor.isNativePlatform()) {
         try {
             const coverStat = await Filesystem.getUri({
                 directory: Directory.Data,
                 path: localCover.replace('file://', '')
             });
             finalCoverUrl = coverStat.uri;
         } catch(e) {
             console.error("Failed to get local cover uri", e);
         }
      }`;
code = code.replace(target1, replacement1);

const target2 = `          QobuzAudio.updateMetadata({
              title: track.title,
              artist: track.artist || "Desconocido",
              album: track.albumTitle || "Qobuz Audio",
              coverUrl: getImageSrc(track.image) || "",
              duration: track.duration || 0
          });`;

const replacement2 = `          QobuzAudio.updateMetadata({
              title: track.title,
              artist: track.artist || "Desconocido",
              album: track.albumTitle || "Qobuz Audio",
              coverUrl: finalCoverUrl,
              duration: track.duration || 0
          });`;
code = code.replace(target2, replacement2);

fs.writeFileSync('src/components/PlayerContext.tsx', code);
