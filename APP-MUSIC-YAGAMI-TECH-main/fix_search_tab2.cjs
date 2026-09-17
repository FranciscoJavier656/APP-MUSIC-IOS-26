const fs = require('fs');
let code = fs.readFileSync('src/components/SearchTab.tsx', 'utf8');

// Ensure MoreHorizontal is imported
if (!code.includes('MoreHorizontal')) {
  code = code.replace("Play, X } from 'lucide-react';", "Play, X, MoreHorizontal } from 'lucide-react';");
}

const trackRowSearch = `<div className="flex-1 min-w-0">
                          <p className={\`font-bold text-[15px] leading-tight truncate \${currentTrack?.id === track.id.toString() ? 'text-[#007AFF]' : ''}\`}>{track.title}</p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            {track.hires && <span className="bg-[#FFB800]/20 text-[#FFB800] text-[8px] font-black px-1 rounded uppercase">Hi-Res</span>}
                            <p className="text-gray-500 text-[13px] truncate">{track.artist?.name || track.performer?.name}</p>
                          </div>
                        </div>`;
const trackRowReplace = `<div className="flex-1 min-w-0">
                          <p className={\`font-bold text-[15px] leading-tight truncate \${currentTrack?.id === track.id.toString() ? 'text-[#007AFF]' : ''}\`}>{track.title}</p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            {track.hires && <span className="bg-[#FFB800]/20 text-[#FFB800] text-[8px] font-black px-1 rounded uppercase">Hi-Res</span>}
                            <p className="text-gray-500 text-[13px] truncate">{track.artist?.name || track.performer?.name}</p>
                          </div>
                        </div>
                        <button 
                          onClick={(e) => { e.stopPropagation(); setContextMenuTrack(track); }}
                          className="p-2 text-gray-400 hover:text-black dark:hover:text-white rounded-full transition-colors opacity-0 group-hover:opacity-100"
                        >
                          <MoreHorizontal className="w-5 h-5" />
                        </button>`;
code = code.replace(trackRowSearch, trackRowReplace);

fs.writeFileSync('src/components/SearchTab.tsx', code);
