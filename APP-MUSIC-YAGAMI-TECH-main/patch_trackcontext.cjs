const fs = require('fs');
let code = fs.readFileSync('src/components/TrackContextMenu.tsx', 'utf8');
code = code.replace(
  /import \{ Play, Share2, Download, Check, ExternalLink \} from 'lucide-react';/,
  "import { Play, Share2, Download, Check, ExternalLink, Music } from 'lucide-react';"
);
fs.writeFileSync('src/components/TrackContextMenu.tsx', code);
