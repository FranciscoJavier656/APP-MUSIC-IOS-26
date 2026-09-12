const fs = require('fs');
let code = fs.readFileSync('src/components/PlaylistView.tsx', 'utf8');

code = code.replace(
  "const { playTrack, currentTrack, isPlaying } = usePlayer();",
  "const { playTrack, currentTrack, isPlaying, setContextMenuTrack, setDownloadItem } = usePlayer();"
);

code = code.replace("import DownloadModal from './DownloadModal';\n", "");
code = code.replace("const [downloadItem, setDownloadItem] = useState<{item: any, type: 'album'|'track'} | null>(null);", "");

const trackMoreBtn = `<button className="p-2 text-gray-400 hover:text-black dark:hover:text-white rounded-full transition-colors">
                    <MoreHorizontal className="w-4 h-4" />
                  </button>`;
const newTrackMoreBtn = `<button 
                    onClick={(e) => { e.stopPropagation(); setContextMenuTrack(track); }}
                    className="p-2 text-gray-400 hover:text-black dark:hover:text-white rounded-full transition-colors"
                  >
                    <MoreHorizontal className="w-4 h-4" />
                  </button>`;
code = code.replace(trackMoreBtn, newTrackMoreBtn);

const dlModalBlock = `<AnimatePresence>
        {downloadItem && (
          <DownloadModal 
            item={downloadItem.item} 
            type={downloadItem.type} 
            onClose={() => setDownloadItem(null)} 
          />
        )}
      </AnimatePresence>`;
code = code.replace(dlModalBlock, "");

fs.writeFileSync('src/components/PlaylistView.tsx', code);
