const fs = require('fs');
let code = fs.readFileSync('src/components/PlaylistView.tsx', 'utf8');

code = code.replace("const [downloadItem, setDownloadItem] = useState<{item: any, type: 'playlist'|'track'} | null>(null);", "");

fs.writeFileSync('src/components/PlaylistView.tsx', code);
