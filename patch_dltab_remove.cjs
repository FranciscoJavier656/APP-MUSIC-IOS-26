const fs = require('fs');
let code = fs.readFileSync('src/components/DownloadsTab.tsx', 'utf8');

const newRemove = `  const removeTrack = async (trackId: string) => {
    if (window.confirm("¿Seguro que deseas eliminar esta descarga?")) {
      try {
        const tracksStr = localStorage.getItem('offline_library_tracks');
        if (tracksStr) {
          const tracksObj = JSON.parse(tracksStr);
          if (tracksObj[trackId]) {
              const lp = tracksObj[trackId].original?.localPath || tracksObj[trackId].localPath;
              delete tracksObj[trackId];
              localStorage.setItem('offline_library_tracks', JSON.stringify(tracksObj));
              
              if (lp) {
                  try {
                      await Filesystem.deleteFile({ directory: Directory.Data, path: lp.replace('file://', '') });
                  } catch(e){}
              }
          }
        }
        
        const oldStr = localStorage.getItem('offline_tracks');
        if (oldStr) {
           const oldObj = JSON.parse(oldStr);
           delete oldObj[trackId];
           localStorage.setItem('offline_tracks', JSON.stringify(oldObj));
        }
        
        loadOfflineLibrary();
      } catch (e) {}
    }
  };`;

code = code.replace(/const removeTrack = \(trackId: string\) => \{[\s\S]*?\} catch \(e\) \{\}\n    \}\n  \};/m, newRemove);
fs.writeFileSync('src/components/DownloadsTab.tsx', code);
console.log("Patched removeTrack in DownloadsTab");
