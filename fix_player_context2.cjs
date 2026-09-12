const fs = require('fs');
let code = fs.readFileSync('src/components/PlayerContext.tsx', 'utf8');

const imports = `import { QobuzAudio } from "../lib/QobuzAudioPlugin";
import axios from "axios";
import TrackContextMenu from './TrackContextMenu';
import DownloadModal from './DownloadModal';`;

code = code.replace(`import { QobuzAudio } from "../lib/QobuzAudioPlugin";\nimport axios from "axios";`, imports);

const providerClose = `        audioRef,
      }}
    >
      {children}
      <TrackContextMenu 
        track={contextMenuTrack} 
        onClose={() => setContextMenuTrack(null)}
        onDownload={() => {
          if (contextMenuTrack) {
            setDownloadItem({item: contextMenuTrack, type: 'track'});
          }
        }}
      />
      {downloadItem && (
        <DownloadModal 
          item={downloadItem.item}
          type={downloadItem.type}
          onClose={() => setDownloadItem(null)}
        />
      )}
    </PlayerContext.Provider>`;

code = code.replace(`        audioRef,\n      }}\n    >\n      {children}\n    </PlayerContext.Provider>`, providerClose);

fs.writeFileSync('src/components/PlayerContext.tsx', code);
