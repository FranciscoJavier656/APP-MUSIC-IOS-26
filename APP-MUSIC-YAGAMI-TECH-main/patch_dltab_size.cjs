const fs = require('fs');
let code = fs.readFileSync('src/components/DownloadsTab.tsx', 'utf8');

code = code.replace(
    /const loadOfflineLibrary = \(\) => \{[\s\S]*?setIsLoading\(false\);\n  \};/m,
    `const loadOfflineLibrary = async () => {
    try {
      const tracksStr = localStorage.getItem('offline_library_tracks'); // Wait, is it offline_tracks or offline_library_tracks? Let's check where it loads from.
      // Wait, in DownloadManager it is offline_library_tracks! Oh, let me just check both!
      const t1 = localStorage.getItem('offline_library_tracks');
      const t2 = localStorage.getItem('offline_tracks');
      const tracksStrReal = t1 || t2 || "{}";
      const tracksObj = JSON.parse(tracksStrReal);
      let tracks = Object.values(tracksObj).sort((a: any, b: any) => {
        return (b.original?.downloadedAt || b.downloadedAt || 0) - (a.original?.downloadedAt || a.downloadedAt || 0);
      });
      
      // Fetch sizes natively
      if (import.meta.env.MODE !== 'production' || true) { // Always run this since we can use dynamic import for Capacitor
         try {
             const m = await import('@capacitor/filesystem');
             const { Filesystem, Directory } = m;
             for(let t of tracks) {
                 const lp = (t as any).original?.localPath || (t as any).localPath || (t as any).original?.local_path;
                 if (lp) {
                     try {
                         const stat = await Filesystem.stat({ directory: Directory.Data, path: lp.replace('file://', '') });
                         (t as any).sizeBytes = stat.size;
                     } catch(e) {}
                 }
             }
         } catch(e) {}
      }

      setOfflineTracks(tracks);
    } catch (e) {
      console.error(e);
      setOfflineTracks([]);
    }
    setIsLoading(false);
  };`
);

// We need to use `track.sizeBytes` in `stats` calculation
code = code.replace(
    /const totalSize = completed\.reduce\(\(acc, item\) => acc \+ \(item\.progress\?\.bytes \|\| 0\), 0\);/,
    "const totalSize = completed.reduce((acc, item) => acc + (item.track?.sizeBytes || item.progress?.bytes || 0), 0);"
);

// We need to call loadOfflineLibrary correctly
code = code.replace(
    /useEffect\(\(\) => \{\n\s*loadOfflineLibrary\(\);\n\s*\}, \[\]\);/,
    "useEffect(() => {\n    loadOfflineLibrary();\n  }, []);"
);

fs.writeFileSync('src/components/DownloadsTab.tsx', code);
console.log("Patched DownloadsTab.tsx size");
