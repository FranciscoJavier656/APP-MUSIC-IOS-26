const fs = require('fs');
let code = fs.readFileSync('src/components/SearchTab.tsx', 'utf8');

code = code.replace(
  "const { playTrack, currentTrack, isPlaying } = usePlayer();",
  "const { playTrack, currentTrack, isPlaying, setContextMenuTrack, setDownloadItem } = usePlayer();"
);

code = code.replace("import DownloadModal from './DownloadModal';\n", "");
code = code.replace("const [downloadItem, setDownloadItem] = useState<{item: any, type: 'album'|'track'} | null>(null);", "");

const dlModalBlock = `      <AnimatePresence>
        {downloadItem && (
          <DownloadModal 
            item={downloadItem.item} 
            type={downloadItem.type} 
            onClose={() => setDownloadItem(null)} 
          />
        )}
      </AnimatePresence>`;
code = code.replace(dlModalBlock, "");

// Look for where to add ... context menu in Tracks results if we have it? Let's check how tracks are rendered in SearchTab
// It just has a row with a Play button in the row or left cover. We can add a MoreHorizontal button.
// Actually, I can use `setContextMenuTrack` in `ExpandedPlayer` first!

fs.writeFileSync('src/components/SearchTab.tsx', code);
