const fs = require('fs');
let code = fs.readFileSync('src/lib/DownloadManager.ts', 'utf8');

const oldImport = `import { Capacitor } from '@capacitor/core';`;
const newImport = `import { Capacitor } from '@capacitor/core';
import axios from 'axios';
import { QobuzAudio } from './audioPlugin';`;
code = code.replace(oldImport, newImport);

// Inside processSingleDownload
const anchor = `delete downloadMap[url];`;
const toInsert = `      try {
        const trackTitle = track.title || '';
        const trackArtist = track.artist?.name || track.performer?.name || '';
        const lrclibUrl = \`https://lrclib.net/api/search?track_name=\${encodeURIComponent(trackTitle)}&artist_name=\${encodeURIComponent(trackArtist)}\`;
        const lrclibRes = await axios.get(lrclibUrl, { timeout: 5000 });
        if (lrclibRes.data && lrclibRes.data.length > 0) {
          const bestMatch = lrclibRes.data[0];
          const lyricsText = bestMatch.syncedLyrics || bestMatch.plainLyrics;
          if (lyricsText) {
            const fileUri = await Filesystem.getUri({ directory: Directory.Data, path: \`Downloads/\${filename}\` });
            await QobuzAudio.embedLyrics({ path: fileUri.uri, lyrics: lyricsText });
          }
        }
      } catch (e) {
        console.log("Lyrics embedding failed or skipped", e);
      }
      
      delete downloadMap[url];`;

code = code.replace(anchor, toInsert);

fs.writeFileSync('src/lib/DownloadManager.ts', code);
console.log("Updated DownloadManager");
