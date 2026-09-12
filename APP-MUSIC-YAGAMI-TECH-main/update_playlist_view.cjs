const fs = require('fs');
let code = fs.readFileSync('src/components/PlaylistView.tsx', 'utf8');

// Import useSwipeBack
code = code.replace(
  "import { usePlayer } from './PlayerContext';",
  "import { usePlayer } from './PlayerContext';\nimport { useSwipeBack } from '../lib/useSwipeBack';"
);

// Call hook
code = code.replace(
  "const [downloadItem, setDownloadItem] = useState<{item: any, type: 'playlist'|'track'} | null>(null);",
  "const [downloadItem, setDownloadItem] = useState<{item: any, type: 'playlist'|'track'} | null>(null);\n  useSwipeBack(onBack);"
);

// Fix error state padding
code = code.replace(
  'return (\n      <div className="p-8">',
  'return (\n      <div className="p-8 pt-16">'
);

// Fix loading state padding
code = code.replace(
  '<div className="flex flex-col items-center justify-center min-h-[50vh]">',
  '<div className="flex flex-col items-center justify-center min-h-[50vh] pt-14">'
);

// Fix success state sticky header padding
code = code.replace(
  '<div className="sticky top-0 z-10 bg-[#F2F2F7]/90 dark:bg-[#000000]/90 backdrop-blur-md px-4 py-3 flex items-center justify-between shadow-sm">',
  '<div className="sticky top-0 z-10 bg-[#F2F2F7]/90 dark:bg-[#000000]/90 backdrop-blur-md px-4 py-3 pt-14 flex items-center justify-between shadow-sm">'
);


fs.writeFileSync('src/components/PlaylistView.tsx', code);
