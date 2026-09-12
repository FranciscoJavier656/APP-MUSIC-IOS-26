const fs = require('fs');
let code = fs.readFileSync('src/components/AlbumView.tsx', 'utf8');

// Import useSwipeBack
code = code.replace(
  "import { usePlayer } from './PlayerContext';",
  "import { usePlayer } from './PlayerContext';\nimport { useSwipeBack } from '../lib/useSwipeBack';"
);

// Call hook
code = code.replace(
  "const [downloadItem, setDownloadItem] = useState<{item: any, type: 'album'|'track'} | null>(null);",
  "const [downloadItem, setDownloadItem] = useState<{item: any, type: 'album'|'track'} | null>(null);\n  useSwipeBack(onBack);"
);

// Fix loading state padding
code = code.replace(
  '<div className="flex flex-col items-center justify-center min-h-[50vh]">',
  '<div className="flex flex-col items-center justify-center min-h-[50vh] pt-14">'
);
code = code.replace(
  'return (\n      <div className="p-8">',
  'return (\n      <div className="p-8 pt-16">'
);

fs.writeFileSync('src/components/AlbumView.tsx', code);
