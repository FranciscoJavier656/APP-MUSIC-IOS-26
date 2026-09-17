const fs = require('fs');
let code = fs.readFileSync('src/components/DownloadModal.tsx', 'utf8');

const target = `{(() => {
                const src = item.album?.image?.small || item.album?.image?.large || item.image?.small || item.image?.large || item.image?.thumbnail || (typeof item.image === 'string' ? item.image : '');
                return src ? <img src={src} alt="" className="w-full h-full object-cover" /> : (
                
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    {type === 'album' ? <Disc /> : <Music />}
                  </div>
                )}
              </div>`;

const replacement = `{(() => {
                const src = item.album?.image?.small || item.album?.image?.large || item.image?.small || item.image?.large || item.image?.thumbnail || (typeof item.image === 'string' ? item.image : '');
                return src ? <img src={src} alt="" className="w-full h-full object-cover" /> : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    {type === 'album' ? <Disc /> : <Music />}
                  </div>
                );
              })()}
              </div>`;

code = code.replace(target, replacement);
fs.writeFileSync('src/components/DownloadModal.tsx', code);
