const fs = require('fs');
let code = fs.readFileSync('src/components/HomeTab.tsx', 'utf8');

// Fix Playlists por categoria
code = code.replace(
  /setActiveItem\(\{id: \(playlists\[i \+ 5\]\?\.id \|\| "1752421"\)\.toString\(\), type: "playlist"\}\)/g,
  `setActiveItem({id: (playlists[i + 5]?.id || playlists[0]?.id || "").toString(), type: "playlist"})`
);

// Fix Karaoke
code = code.replace(
  /id: playlists\[3\]\?\.id \|\| '1752421'/g,
  `id: playlists[3]?.id || playlists[0]?.id || ""`
);
code = code.replace(
  /id: playlists\[4\]\?\.id \|\| '1752421'/g,
  `id: playlists[4]?.id || playlists[0]?.id || ""`
);
code = code.replace(
  /id: playlists\[5\]\?\.id \|\| '1752421'/g,
  `id: playlists[5]?.id || playlists[0]?.id || ""`
);
code = code.replace(
  /karaoke\.id \|\| "1752421"/g,
  `karaoke.id || playlists[0]?.id || ""`
);

// Fix Tu musica (My Weekly Q)
code = code.replace(
  /id: \(playlists\[0\]\?\.id \|\| "1752421"\)\.toString\(\)/g,
  `id: (playlists[0]?.id || "").toString()`
);

// Fix Lanzamientos para ti
code = code.replace(
  /id: "7802330"/g,
  `id: (playlists[1]?.id || "").toString()`
);

// Fix Artistas similares a lo que escuchas (changing type from 'album' to 'artist' or keeping it 'album' if mostStreamed are albums)
// mostStreamed comes from getFeaturedAlbums('most-streamed') so they are albums. Let's make it display album title instead of artist name, but keep artist name as subtitle.
const artistsCode = `
              {renderSectionHeader("Artistas similares a lo que escuchas")}
              <div className="flex overflow-x-auto pb-8 px-5 gap-5 no-scrollbar">
                {mostStreamed.slice(0, 6).map((item) => (
                  <div key={item.id + 'artist'} onClick={() => setActiveItem({id: item.id.toString(), type: "album"})} className="flex-none w-[160px] cursor-pointer group flex flex-col items-center text-center">
                    <div className="relative w-28 h-28 mb-3 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-800 border shadow-sm">
                      <img src={getImageSrc(item.image)} alt={item.artist?.name} className="w-full h-full object-cover" onError={(e) => { e.currentTarget.src = 'https://placehold.co/400x400/1C1C1E/FFFFFF/png?text=Audio' }} />
                    </div>
                    <h3 className="font-semibold text-[15px] line-clamp-1 leading-tight w-full">{item.artist?.name}</h3>
                  </div>
                ))}
              </div>
`;

const newArtistsCode = `
              {renderSectionHeader("Top Recomendaciones")}
              <div className="flex overflow-x-auto pb-8 px-5 gap-5 no-scrollbar">
                {mostStreamed.slice(0, 6).map((item) => (
                  <div key={item.id + 'artist'} onClick={() => setActiveItem({id: item.id.toString(), type: "album"})} className="flex-none w-[160px] cursor-pointer group flex flex-col items-center text-center">
                    <div className="relative w-28 h-28 mb-3 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-800 border shadow-sm">
                      <img src={getImageSrc(item.image)} alt={item.title} className="w-full h-full object-cover" onError={(e) => { e.currentTarget.src = 'https://placehold.co/400x400/1C1C1E/FFFFFF/png?text=Audio' }} />
                    </div>
                    <h3 className="font-semibold text-[15px] line-clamp-1 leading-tight w-full">{item.artist?.name}</h3>
                    <p className="text-[12px] text-gray-500 line-clamp-1 w-full">{item.title}</p>
                  </div>
                ))}
              </div>
`;

code = code.replace(artistsCode, newArtistsCode);

fs.writeFileSync('src/components/HomeTab.tsx', code);
