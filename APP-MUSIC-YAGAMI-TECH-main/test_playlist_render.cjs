const fs = require('fs');

let code = fs.readFileSync('src/components/HomeTab.tsx', 'utf8');

const regex = /{playlists\.map\(\(item\) => \([\s\S]*?\}\)\)}/m;

const replacement = `{playlists.map((item) => (
              <div key={item.id} className="flex-none w-[160px] cursor-pointer group" onClick={() => setSelectedAlbumId(item.id.toString())}>
                <div className="relative aspect-square mb-3 rounded-lg overflow-hidden bg-gray-200 dark:bg-gray-800">
                  {item.images300 && item.images300.length === 4 ? (
                    <div className="grid grid-cols-2 w-full h-full">
                      <img src={item.images300[0]} alt={item.name} className="w-full h-full object-cover" />
                      <img src={item.images300[1]} alt={item.name} className="w-full h-full object-cover" />
                      <img src={item.images300[2]} alt={item.name} className="w-full h-full object-cover" />
                      <img src={item.images300[3]} alt={item.name} className="w-full h-full object-cover" />
                    </div>
                  ) : item.images300 && item.images300.length > 0 ? (
                    <img src={item.images300[0]} alt={item.name} className="w-full h-full object-cover" />
                  ) : (
                    <img src={item.image?.large || item.image?.root || item.image_rectangle?.[0]} alt={item.name} className="w-full h-full object-cover" />
                  )}
                </div>
                <h3 className="font-semibold text-[15px] line-clamp-1 leading-tight">{item.name}</h3>
                <p className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase mt-1">SELECCIÓN DEL EQUIPO</p>
              </div>
            ))}`;

code = code.replace(regex, replacement);

fs.writeFileSync('src/components/HomeTab.tsx', code);
