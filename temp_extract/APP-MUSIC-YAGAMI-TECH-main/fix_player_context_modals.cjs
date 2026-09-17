const fs = require('fs');
let code = fs.readFileSync('src/components/PlayerContext.tsx', 'utf8');

const target = `      >
        {children}
      </PlayerContext.Provider>`;

const replacement = `      >
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

code = code.replace(target, replacement);
fs.writeFileSync('src/components/PlayerContext.tsx', code);
