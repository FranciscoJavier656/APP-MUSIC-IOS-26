const fs = require('fs');
let code = fs.readFileSync('src/components/DownloadModal.tsx', 'utf8');

code = code.replace(
  "const getTracks = () => {",
  "const [fullTracks, setFullTracks] = useState<any[] | null>(null);\n  const getTracks = () => {"
);

code = code.replace(
  "if (type === 'album') return item.tracks?.items || [];",
  "if (type === 'album') return fullTracks || item.tracks?.items || [];"
);

code = code.replace(
  "if (type === 'playlist') return item.tracks?.items || [];",
  "if (type === 'playlist') return fullTracks || item.tracks?.items || [];"
);

code = code.replace(
  "useEffect(() => {\n    setStatus('idle');\n    setProgress({ current: 0, total: getTracks().length });\n  }, [item, type]);",
  `useEffect(() => {
    setStatus('idle');
    setFullTracks(null);
    if ((type === 'album' || type === 'playlist') && !item.tracks?.items) {
      // Need to fetch full tracks
      const fetchTracks = async () => {
        try {
          if (type === 'album') {
             const res = await fetch(\`/api/album?album_id=\${item.id || item.qobuz_id}\`).then(r => r.json());
             setFullTracks(res.tracks?.items || []);
             setProgress({ current: 0, total: (res.tracks?.items || []).length });
          } else {
             const res = await fetch(\`/api/playlist?playlist_id=\${item.id}\`).then(r => r.json());
             setFullTracks(res.tracks?.items || []);
             setProgress({ current: 0, total: (res.tracks?.items || []).length });
          }
        } catch (e) {
          console.error(e);
        }
      };
      fetchTracks();
    } else {
      setProgress({ current: 0, total: getTracks().length });
    }
  }, [item, type]);`
);

fs.writeFileSync('src/components/DownloadModal.tsx', code);
