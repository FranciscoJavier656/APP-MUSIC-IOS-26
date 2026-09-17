const fs = require('fs');

let code = fs.readFileSync('src/components/DownloadModal.tsx', 'utf8');

const oldModal = `        try {
          if (Capacitor.isNativePlatform()) {
            addDownload(track.id.toString(), track);
          }
          const success = await downloadTrackRouted(track, format, ext);
          if (!success) {
            console.warn("Skipped or failed download for track:", track.id);
          }
          
          if (!Capacitor.isNativePlatform()) { 
             // Delay slightly between tracks on Web only since native is async queued
             await new Promise(r => setTimeout(r, 1000));
          }
        } catch (e) {
          console.error("Failed to trigger download for track", track.id, e);
        }
        setProgress(p => ({ ...p, current: i + 1 }));
      }
      
      if (Capacitor.isNativePlatform()) { setStatus('done'); setTimeout(() => onClose(), 800); } else { setStatus('done'); }`;

const newModal = `        try {
          addDownload(track.id.toString(), track);
          const success = await downloadTrackRouted(track, format, ext);
          if (!success) {
            console.warn("Skipped or failed download for track:", track.id);
          }
        } catch (e) {
          console.error("Failed to trigger download for track", track.id, e);
        }
        setProgress(p => ({ ...p, current: i + 1 }));
      }
      
      setStatus('done'); 
      setTimeout(() => onClose(), 800);`;

code = code.replace(oldModal, newModal);
fs.writeFileSync('src/components/DownloadModal.tsx', code);
console.log('done');
