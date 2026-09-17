const fs = require('fs');
let code = fs.readFileSync('src/components/PlayerContext.tsx', 'utf8');

const target = `  const playTrack = async (rawTrack: any, newQueue?: Track[]) => {
    let track = { ...rawTrack } as Track;
    if (!track.image) {
       track.image = rawTrack.album?.image || rawTrack.original?.album?.image || rawTrack.original?.image || "";
    }
    if (!track.artist || typeof track.artist !== 'string') {
       track.artist = rawTrack.artist?.name || rawTrack.performer?.name || rawTrack.original?.artist?.name || rawTrack.subtitle || "Unknown Artist";
    }

    const requestId = ++playRequestRef.current;

    setCurrentTrack(track);`;

const replacement = `  const playTrack = async (rawTrack: any, newQueue?: Track[]) => {
    let track = { ...rawTrack } as Track;
    if (!track.image) {
       track.image = rawTrack.album?.image || rawTrack.original?.album?.image || rawTrack.original?.image || "";
    }
    if (!track.artist || typeof track.artist !== 'string') {
       track.artist = rawTrack.artist?.name || rawTrack.performer?.name || rawTrack.original?.artist?.name || rawTrack.subtitle || "Unknown Artist";
    }

    const localCover = track.localCoverPath || (track.original && track.original.localCoverPath);
    if (localCover && Capacitor.isNativePlatform()) {
       try {
           const coverStat = await Filesystem.getUri({
               directory: Directory.Data,
               path: localCover.replace('file://', '')
           });
           track.image = coverStat.uri;
       } catch(e) {
           console.error("Failed to get local cover uri", e);
       }
    }

    const requestId = ++playRequestRef.current;
    setCurrentTrack(track);`;

code = code.replace(target, replacement);

const target2 = `    try {
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

const replacement2 = `    try {
      let streamUrl = track.streamUrl || "";
      const finalCoverUrl = getImageSrc(track.image) || "";
      const lp = track.localPath || track.local_path || (track.original && (track.original.localPath || track.original.local_path));`;

code = code.replace(target2, replacement2);

fs.writeFileSync('src/components/PlayerContext.tsx', code);
