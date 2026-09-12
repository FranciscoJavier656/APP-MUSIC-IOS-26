const fs = require('fs');
let code = fs.readFileSync('src/components/OfflineDetailView.tsx', 'utf8');

const splitToken = `  const heroImage = typeof item.image === 'string' ? item.image : (item.image?.large || item.image?.small || '');`;
const parts = code.split(splitToken);

if (parts.length === 2) {
  const newBottom = `  const heroImage = typeof item.image === 'string' ? item.image : (item.image?.large || item.image?.small || '');
  return (
    <div ref={containerRef} className="h-full w-full overflow-y-auto bg-[#F2F2F7] dark:bg-[#000000] relative pb-[180px]">
      <div className="absolute top-0 left-0 w-full h-[500px] overflow-hidden -z-10 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-[#F2F2F7]/80 to-[#F2F2F7] dark:from-black/60 dark:via-black/80 dark:to-[#000000] z-10" />
        <img src={heroImage} alt="" className="w-full h-full object-cover blur-[80px] opacity-60 dark:opacity-40 transform scale-110" />
      </div>

      <motion.header className="sticky top-0 z-40 px-4 pt-12 pb-3 flex items-center justify-between">
        <motion.div style={{ opacity: headerOpacity }} className="absolute inset-0 bg-[#F2F2F7] dark:bg-[#000000] shadow-sm" />
        <button onClick={onBack} className="relative z-10 w-10 h-10 flex items-center justify-center bg-black/10 dark:bg-white/10 rounded-full backdrop-blur-md text-black dark:text-white">
          <ChevronLeft className="w-6 h-6 -ml-1" />
        </button>
        <motion.div style={{ opacity: titleOpacity }} className="relative z-10 flex-1 px-4 text-center">
          <h1 className="text-base font-bold text-black dark:text-white line-clamp-1">{item.title}</h1>
        </motion.div>
        <div className="w-10 h-10" />
      </motion.header>

      <div className="px-5 md:px-8 pt-4">
        <div className="flex flex-col items-center text-center mt-2 md:mt-8 mb-8">
          <motion.div style={{ scale: imageScale, opacity: imageOpacity }} className={\`w-56 md:w-72 aspect-square relative \${type === 'artist' ? 'rounded-full' : 'rounded-3xl'} overflow-hidden shadow-2xl mb-6\`}>
            <img src={heroImage} alt={item.title} className="w-full h-full object-cover" />
          </motion.div>
          <h1 className="text-3xl md:text-5xl font-black tracking-tighter text-black dark:text-white leading-tight mb-2 max-w-[90%]">{item.title}</h1>
          <p className="text-xl md:text-2xl text-gray-500 font-bold mb-4">{type === 'album' ? item.subtitle : 'Artista'}</p>
          <div className="flex items-center gap-4 mb-4">
            <button onClick={() => handlePlay(tracks[0])} className="w-16 h-16 flex items-center justify-center bg-[#007AFF] text-white rounded-full shadow-xl hover:scale-105 transition-transform">
              <Play className="w-7 h-7 fill-current ml-1" />
            </button>
          </div>
        </div>

        <div className="mt-8">
          <h3 className="text-lg font-bold text-black dark:text-white mb-4">Descargas locales</h3>
          <div className="space-y-1">
            {tracks.map((track, idx) => {
              const orig = track.original || track;
              const isCurrent = currentTrack?.id === (orig.id?.toString() || track.id);
              
              return (
                <div key={track.id || idx} onClick={() => handlePlay(track)} className="flex items-center space-x-4 p-3 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 transition-colors group cursor-pointer">
                  <div className="w-6 text-center">
                    {isCurrent && isPlaying ? (
                      <div className="flex gap-0.5 justify-center h-4 items-end">
                        <div className="w-1 bg-[#007AFF] animate-[bounce_1s_infinite] h-2"></div>
                        <div className="w-1 bg-[#007AFF] animate-[bounce_1s_infinite_0.2s] h-4"></div>
                        <div className="w-1 bg-[#007AFF] animate-[bounce_1s_infinite_0.4s] h-3"></div>
                      </div>
                    ) : (
                      <span className="text-gray-400 font-bold text-[13px]">{idx + 1}</span>
                    )}
                  </div>
                  <div className="relative w-12 h-12 rounded-md overflow-hidden bg-gray-200 dark:bg-gray-800">
                    <img src={getImageSrc(track.image)} alt="" className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={\`font-bold text-[15px] leading-snug truncate \${isCurrent ? 'text-[#007AFF]' : 'text-black dark:text-white'}\`}>{track.title}</p>
                    <p className="text-gray-500 text-[13px] font-medium truncate mt-0.5">{track.subtitle || 'Unknown'}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
`;
  fs.writeFileSync('src/components/OfflineDetailView.tsx', parts[0] + newBottom);
  console.log("Rewrote OfflineDetailView");
} else {
  console.log("Could not split OfflineDetailView");
}
