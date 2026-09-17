const fs = require('fs');
let code = fs.readFileSync('src/components/ExpandedPlayer.tsx', 'utf8');

// Ensure Download is imported
if (!code.includes('Download } from')) {
  code = code.replace("Info, MoreHorizontal } from 'lucide-react';", "Info, MoreHorizontal, Download } from 'lucide-react';");
}

// Add downloadItem to usePlayer extraction
if (!code.includes('setDownloadItem')) {
  code = code.replace(
    "audioRef, queue, setContextMenuTrack",
    "audioRef, queue, setContextMenuTrack, setDownloadItem"
  );
}

const trackInfoSearch = `<div className="overflow-hidden pr-4">
            <h2 className="text-2xl sm:text-3xl font-bold text-black dark:text-white truncate tracking-tight">{currentTrack.title}</h2>
            <p className="text-lg text-black/60 dark:text-white/60 truncate mt-1">{currentTrack.artist}</p>
          </div>
          <div className="flex-shrink-0 flex flex-col items-end gap-2 relative">
            <button 
              onClick={() => setShowMetadata(!showMetadata)}`;

const trackInfoReplace = `<div className="overflow-hidden pr-4">
            <h2 className="text-2xl sm:text-3xl font-bold text-black dark:text-white truncate tracking-tight">{currentTrack.title}</h2>
            <p className="text-lg text-black/60 dark:text-white/60 truncate mt-1">{currentTrack.artist}</p>
          </div>
          
          <div className="flex items-center gap-3 relative">
            <button 
              onClick={(e) => { e.stopPropagation(); setDownloadItem({item: currentTrack, type: 'track'}); }}
              className="w-10 h-10 flex-shrink-0 rounded-full bg-black/5 dark:bg-white/10 flex items-center justify-center text-black dark:text-white hover:bg-black/10 dark:hover:bg-white/20 transition-colors"
            >
              <Download className="w-5 h-5" />
            </button>
            <button 
              onClick={(e) => { e.stopPropagation(); setContextMenuTrack(currentTrack); }}
              className="w-10 h-10 flex-shrink-0 rounded-full bg-black/5 dark:bg-white/10 flex items-center justify-center text-black dark:text-white hover:bg-black/10 dark:hover:bg-white/20 transition-colors"
            >
              <MoreHorizontal className="w-5 h-5" />
            </button>
            
          <div className="flex-shrink-0 flex flex-col items-end gap-2 relative">
            <button 
              onClick={() => setShowMetadata(!showMetadata)}`;

code = code.replace(trackInfoSearch, trackInfoReplace);
fs.writeFileSync('src/components/ExpandedPlayer.tsx', code);
