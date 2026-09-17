const fs = require('fs');
let code = fs.readFileSync('src/components/PlayerContext.tsx', 'utf8');

const targetPlay = `      if (streamUrl && audioRef.current) {
        if (Capacitor.isNativePlatform()) {
          await QobuzAudio.play({ url: streamUrl });
          QobuzAudio.updateMetadata({
              title: track.title,
              artist: track.artist || "Desconocido",
              album: track.albumTitle || "Qobuz Audio",
              coverUrl: finalCoverUrl,
              duration: track.duration || 0
          });
          setIsPlaying(true);
          setIsLoading(false);`;

const replacePlay = `      if (streamUrl && audioRef.current) {
        if (Capacitor.isNativePlatform()) {
          try {
            await QobuzAudio.play({ url: streamUrl });
            QobuzAudio.updateMetadata({
                title: track.title,
                artist: track.artist || "Desconocido",
                album: track.albumTitle || "Qobuz Audio",
                coverUrl: finalCoverUrl,
                duration: track.duration || 0
            });
            setIsPlaying(true);
            setIsLoading(false);
          } catch (playErr) {
            console.error("Native playback error:", playErr);
            setIsLoading(false);
            return;
          }`;
code = code.replace(targetPlay, replacePlay);

const targetNetworkUrl = `      if (!streamUrl && track.local_path && Capacitor.isNativePlatform()) {
        streamUrl = track.local_path.startsWith('file://') ? track.local_path : \`file://\${track.local_path}\`;
      } else if (!streamUrl) {
        streamUrl = await getQobuzTrackUrl(track.id.toString(), "5");
      }`;

const replaceNetworkUrl = `      if (!streamUrl && track.local_path && Capacitor.isNativePlatform()) {
        streamUrl = track.local_path.startsWith('file://') ? track.local_path : \`file://\${track.local_path}\`;
      } else if (!streamUrl) {
        try {
           streamUrl = await getQobuzTrackUrl(track.id.toString(), "5");
        } catch (networkError) {
           console.error("Failed to get stream URL (offline?):", networkError);
           setIsLoading(false);
           return;
        }
      }`;
code = code.replace(targetNetworkUrl, replaceNetworkUrl);

fs.writeFileSync('src/components/PlayerContext.tsx', code);
