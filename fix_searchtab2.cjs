const fs = require('fs');
let code = fs.readFileSync('src/components/SearchTab.tsx', 'utf8');

// 1. Add 'artists' to filter mode and increase limits
code = code.replace(
  "const [filterMode, setFilterMode] = useState<'all' | 'albums' | 'tracks'>('all');",
  "const [filterMode, setFilterMode] = useState<'all' | 'albums' | 'tracks' | 'artists'>('all');"
);

// 2. Bento cards click handler
code = code.replace(
  "key={genre.id} \n                    className={`relative",
  "key={genre.id} \n                    onClick={() => { setQuery(genre.name); setIsFocused(false); executeSearch(genre.name); }}\n                    className={`relative"
);

// 3. Filter pills map
code = code.replace(
  "{['all', 'albums', 'tracks'].map(mode => (",
  "{['all', 'albums', 'tracks', 'artists'].map(mode => ("
);
code = code.replace(
  "{mode === 'all' ? 'Todo' : mode === 'albums' ? 'Álbumes' : 'Pistas'}",
  "{mode === 'all' ? 'Todo' : mode === 'albums' ? 'Álbumes' : mode === 'tracks' ? 'Pistas' : 'Artistas'}"
);

// 4. Update limits
code = code.replace(
  "results.albums.items.slice(0, filterMode === 'albums' ? 20 : 4).map",
  "results.albums.items.slice(0, filterMode === 'albums' ? 50 : 8).map"
);
code = code.replace(
  "results.tracks.items.slice(0, filterMode === 'tracks' ? 20 : 5).map",
  "results.tracks.items.slice(0, filterMode === 'tracks' ? 50 : 5).map"
);

// 5. Inject Artists rendering
const tracksSection = `              {/* Tracks List */}`;
const artistsSection = `              {/* Artists List */}
              {(filterMode === 'all' || filterMode === 'artists') && results.artists?.items && results.artists.items.length > 0 && (
                <section className="mb-8">
                  <h2 className="text-xl font-black tracking-tighter mb-4 text-black dark:text-white">Artistas</h2>
                  <div className="flex gap-4 overflow-x-auto no-scrollbar pb-4">
                    {results.artists.items.slice(0, filterMode === 'artists' ? 50 : 6).map((artist: any) => (
                      <div 
                        key={artist.id} 
                        onClick={() => { setQuery(artist.name); setIsFocused(false); executeSearch(artist.name); }} 
                        className="flex-none w-[100px] flex flex-col items-center gap-2 cursor-pointer group"
                      >
                        <div className="w-[90px] h-[90px] rounded-full bg-gray-200 dark:bg-gray-800 shadow-sm overflow-hidden border border-black/5 dark:border-white/5 relative">
                          {(artist.picture || artist.image) ? (
                            <img src={artist.picture || artist.image} alt={artist.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400 font-black text-2xl">
                              {artist.name.charAt(0)}
                            </div>
                          )}
                        </div>
                        <p className="font-bold text-[13px] leading-tight text-center line-clamp-2">{artist.name}</p>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Tracks List */}`;

code = code.replace(tracksSection, artistsSection);

fs.writeFileSync('src/components/SearchTab.tsx', code);
