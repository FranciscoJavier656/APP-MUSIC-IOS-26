const fs = require('fs');
let code = fs.readFileSync('src/components/ExpandedPlayer.tsx', 'utf8');

const badPart = `          {dominantColor && (
            <div 
              className="absolute inset-0 opacity-[0.08] dark:opacity-[0.15] mix-blend-screen dark:mix-blend-lighten pointer-events-none"
              style={{ background: \`radial-gradient(circle at 100% 0%, \${dominantColor} 0%, transparent 60%)\` }}
            />
          )}
    </AnimatePresence>
  );
}`;

const goodPart = `          {dominantColor && (
            <div 
              className="absolute inset-0 opacity-[0.08] dark:opacity-[0.15] mix-blend-screen dark:mix-blend-lighten pointer-events-none"
              style={{ background: \`radial-gradient(circle at 100% 0%, \${dominantColor} 0%, transparent 60%)\` }}
            />
          )}
          <div onTouchMove={(e) => e.stopPropagation()} className="flex-1 overflow-y-auto pb-20 space-y-4">
            {queue.map((track, idx) => {
              const isPlayingQueue = currentTrack?.id === track.id;
              return (
                <div key={idx} onClick={() => playTrack(track)} className={\`flex items-center gap-4 p-3 rounded-2xl cursor-pointer hover:bg-black/5 dark:hover:bg-white/10 transition-colors \${isPlayingQueue ? 'bg-black/5 dark:bg-white/10' : ''}\`}>
                  <OfflineImage localPath={track.localCoverPath || track.original?.localCoverPath} remoteUrl={getImageSrc(track?.album?.image || track?.image)} alt={track.title} className="w-14 h-14 rounded-xl object-cover shadow-sm" />
                  <div className="flex-1 min-w-0">
                    <p className={\`font-bold truncate \${isPlayingQueue ? 'text-black dark:text-white' : 'text-black/80 dark:text-white/80'}\`}>
                      {track.title}
                    </p>
                    <p className="text-sm text-black/50 dark:text-white/50 truncate">{track.artist}</p>
                  </div>
                  {isPlayingQueue && (
                    <div className="w-4 h-4 flex items-end justify-between gap-[2px]">
                      <div className="w-[3px] bg-black dark:bg-white rounded-full animate-[bounce_1s_infinite] h-2"></div>
                      <div className="w-[3px] bg-black dark:bg-white rounded-full animate-[bounce_1s_infinite_0.2s] h-4"></div>
                      <div className="w-[3px] bg-black dark:bg-white rounded-full animate-[bounce_1s_infinite_0.4s] h-3"></div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
      </div>
      </motion.div>
      )}
    </AnimatePresence>
  );
}`;

if (code.includes(badPart)) {
    code = code.replace(badPart, goodPart);
    fs.writeFileSync('src/components/ExpandedPlayer.tsx', code);
    console.log("Queue fixed.");
} else {
    console.log("Could not find bad part.");
}
