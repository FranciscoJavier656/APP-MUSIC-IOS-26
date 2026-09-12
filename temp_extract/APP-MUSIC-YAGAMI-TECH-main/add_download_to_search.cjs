const fs = require('fs');
let code = fs.readFileSync('src/components/SearchTab.tsx', 'utf8');

const searchBtn = `<button 
                          onClick={(e) => { e.stopPropagation(); setContextMenuTrack(track); }}
                          className="p-2 text-gray-400 hover:text-black dark:hover:text-white rounded-full transition-colors opacity-100"
                        >
                          <MoreHorizontal className="w-5 h-5" />
                        </button>`;

const replaceBtn = `<button 
                          onClick={(e) => { e.stopPropagation(); setDownloadItem({item: track, type: 'track'}); }}
                          className="p-2 text-gray-400 hover:text-[#007AFF] transition-colors opacity-100"
                        >
                          <Download className="w-5 h-5" />
                        </button>
                        <button 
                          onClick={(e) => { e.stopPropagation(); setContextMenuTrack(track); }}
                          className="p-2 text-gray-400 hover:text-black dark:hover:text-white rounded-full transition-colors opacity-100"
                        >
                          <MoreHorizontal className="w-5 h-5" />
                        </button>`;

code = code.replace(searchBtn, replaceBtn);
fs.writeFileSync('src/components/SearchTab.tsx', code);
