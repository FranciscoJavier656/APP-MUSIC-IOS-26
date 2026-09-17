const fs = require('fs');

let code = fs.readFileSync('src/components/ExpandedPlayer.tsx', 'utf8');

const targetContent = `      {/* Track Info & Controls */}
      <div className="mt-2 mb-8 relative z-10">
        <div className="flex justify-between items-end mb-6">
          <div className="overflow-hidden pr-4">
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
          </div>
            
          <div className="flex-shrink-0 flex flex-col items-end gap-2 relative">
            <button 
              onClick={() => setShowMetadata(!showMetadata)}
              className="px-2.5 py-1 bg-black/5 dark:bg-white/10 rounded-md text-[10px] font-bold tracking-widest text-black/80 dark:text-white/80 border border-black/10 dark:border-white/10 uppercase hover:bg-black/10 dark:hover:bg-white/20 transition-colors"
            >
              Lossless
            </button>
            <span className="text-[10px] font-medium tracking-wide text-black/40 dark:text-white/40 uppercase">
              FLAC • 16-Bit / 44.1 kHz
            </span>
            
            {showMetadata && (
              <div className="absolute bottom-full right-0 mb-4 p-4 bg-white/95 dark:bg-[#1a1a1a]/95 backdrop-blur-xl shadow-2xl rounded-2xl border border-black/5 dark:border-white/5 w-64 text-left z-50">
                 <h4 className="font-bold text-sm mb-3 text-black dark:text-white flex items-center gap-2">
                   <Info className="w-4 h-4" /> Calidad de Audio
                 </h4>
                 <div className="space-y-2 text-xs text-black/70 dark:text-white/70">
                   <p className="flex justify-between"><span>Formato:</span> <span className="font-mono font-medium">FLAC</span></p>
                   <p className="flex justify-between"><span>Frecuencia:</span> <span className="font-mono font-medium">44.1 kHz</span></p>
                   <p className="flex justify-between"><span>Profundidad:</span> <span className="font-mono font-medium">16-Bit</span></p>
                   <p className="flex justify-between"><span>Bitrate:</span> <span className="font-mono font-medium">1032 kbps</span></p>
                 </div>
              </div>
            )}
          </div>
        </div>`;

const newContent = `      {/* Track Info & Controls */}
      <div className="mt-2 mb-8 relative z-10">
        <div className="flex items-center justify-between mb-6">
          {/* Left: Title, Artist and Badge */}
          <div className="overflow-hidden pr-4 flex-1">
            <h2 className="text-2xl sm:text-3xl font-bold text-black dark:text-white truncate tracking-tight">{currentTrack.title}</h2>
            <div className="flex items-center gap-3 mt-1.5">
              <p className="text-lg text-black/60 dark:text-white/60 truncate">{currentTrack.artist}</p>
              
              <div className="relative flex-shrink-0">
                <button 
                  onClick={() => setShowMetadata(!showMetadata)}
                  className="px-2 py-0.5 bg-black/5 dark:bg-white/10 rounded-sm text-[9px] font-bold tracking-widest text-black/80 dark:text-white/80 border border-black/10 dark:border-white/10 uppercase hover:bg-black/10 dark:hover:bg-white/20 transition-colors flex items-center"
                >
                  Lossless
                </button>
                {showMetadata && (
                  <div className="absolute bottom-full left-0 mb-3 p-4 bg-white/95 dark:bg-[#1a1a1a]/95 backdrop-blur-xl shadow-2xl rounded-2xl border border-black/5 dark:border-white/5 w-56 text-left z-50">
                     <h4 className="font-bold text-sm mb-3 text-black dark:text-white flex items-center gap-2">
                       <Info className="w-4 h-4" /> Calidad
                     </h4>
                     <div className="space-y-2 text-xs text-black/70 dark:text-white/70">
                       <p className="flex justify-between"><span>Formato:</span> <span className="font-mono font-medium">FLAC</span></p>
                       <p className="flex justify-between"><span>Frecuencia:</span> <span className="font-mono font-medium">44.1 kHz</span></p>
                       <p className="flex justify-between"><span>Prof:</span> <span className="font-mono font-medium">16-Bit</span></p>
                     </div>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Right: Actions */}
          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
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
          </div>
        </div>`;

if(code.includes(targetContent)) {
    code = code.replace(targetContent, newContent);
    fs.writeFileSync('src/components/ExpandedPlayer.tsx', code);
    console.log("Layout fixed successfully");
} else {
    console.error("Target content not found. Creating a more robust replace.");
}
