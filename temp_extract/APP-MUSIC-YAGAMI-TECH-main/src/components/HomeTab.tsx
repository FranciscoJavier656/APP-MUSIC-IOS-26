import { useState, useEffect } from 'react';
import { getFeaturedAlbums, getFeaturedPlaylists } from "../lib/qobuz";
import { Loader2, Disc, Play, Heart, ChevronRight, Home as HomeIcon, SlidersHorizontal } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';

interface QobuzItem {
  id: string;
  title?: string;
  name?: string;
  artist?: { name: string };
  image?: { large?: string; small?: string; thumbnail?: string; root?: string };
  image_rectangle?: string[];
  images300?: string[];
  hires?: boolean;
  maximum_bit_depth?: number;
}

import AlbumView from './AlbumView';
import PlaylistView from './PlaylistView';
import ParaTiSection from './ParaTiSection';
import { getImageSrc } from '../lib/image';

export default function HomeTab() {
  const [activeItem, setActiveItem] = useState<{id: string, type: string} | null>(null);
  const [loading, setLoading] = useState(true);
  const [editorPicks, setEditorPicks] = useState<QobuzItem[]>([]);
  const [mostStreamed, setMostStreamed] = useState<QobuzItem[]>([]);
  const [playlists, setPlaylists] = useState<QobuzItem[]>([]);
  
  
  const [activeSubTab, setActiveSubTab] = useState('editorial');
  const [activeCategory, setActiveCategory] = useState('Lanzamientos');

  
  const [categoryLoading, setCategoryLoading] = useState(false);

  useEffect(() => {
    const fetchPlaylists = async () => {
      try {
        const res = await getFeaturedPlaylists();
        setPlaylists(res?.playlists?.items || []);
      } catch (e) {
        console.error(e);
      }
    };
    fetchPlaylists();
  }, []);

  useEffect(() => {
    const fetchHomeData = async () => {
      if (editorPicks.length === 0) setLoading(true);
      else setCategoryLoading(true);

      let genreId: string | undefined = undefined;
      let limit = 15;
      
      if (activeCategory === 'Pop') genreId = '127';
      else if (activeCategory === 'Jazz') genreId = '80';
      else if (activeCategory === 'Clásica') genreId = '10';
      else if (activeCategory === 'Electrónica') genreId = '14';
      else if (activeCategory === 'Relajación') genreId = '94'; // World/New Age equivalent

      if (activeCategory === 'Audio Hi-Res') {
        limit = 50;
      }

      try {
        const [resEditor, resStreamed] = await Promise.all([
          getFeaturedAlbums('editor-picks', genreId, limit),
          getFeaturedAlbums('most-streamed', genreId, limit)
        ]);
        
        let ep = resEditor?.albums?.items || [];
        let ms = resStreamed?.albums?.items || [];

        if (activeCategory === 'Audio Hi-Res') {
          ep = ep.filter(a => a.hires);
          ms = ms.filter(a => a.hires);
        }

        setEditorPicks(ep);
        setMostStreamed(ms);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
        setCategoryLoading(false);
      }
    };
    fetchHomeData();
  }, [activeCategory]);


  

  const renderSectionHeader = (title: string, subtitle?: string) => (
    <div className="px-5 mb-5 mt-12">
      <div className="flex justify-between items-end">
        <div className="max-w-[85%]">
          <h2 className="text-3xl font-black tracking-tighter text-black dark:text-white leading-tight">{title}</h2>
          {subtitle && <p className="text-[15px] font-medium text-gray-500 dark:text-gray-400 mt-1.5 leading-snug">{subtitle}</p>}
        </div>
      </div>
    </div>
  );

  return (
    <>

      <AnimatePresence mode="wait">
        {activeItem?.type === 'album' && (
          <motion.div 
            key="album-view"
            initial={{ opacity: 0, x: "100%" }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: "100%" }} transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed inset-0 z-50 bg-[#F2F2F7] dark:bg-[#000000]"
          >
            <AlbumView albumId={activeItem.id} onBack={() => setActiveItem(null)} />
          </motion.div>
        )}
        {activeItem?.type === 'playlist' && (
          <motion.div 
            key="playlist-view"
            initial={{ opacity: 0, x: "100%" }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: "100%" }} transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed inset-0 z-50 bg-[#F2F2F7] dark:bg-[#000000]"
          >
            <PlaylistView playlistId={activeItem.id} onBack={() => setActiveItem(null)} />
          </motion.div>
        )}
      </AnimatePresence>
    <div className="h-full w-full bg-[#F2F2F7] dark:bg-[#000000] text-black dark:text-white transition-colors duration-300 overflow-y-auto pb-[180px]">
      {/* Header Tabs */}
      <div className="pt-14 pb-4 px-5 sticky top-0 bg-[#F2F2F7]/90 dark:bg-[#000000]/90 backdrop-blur-2xl z-10 border-b border-black/5 dark:border-white/5">
        <div className="flex items-center justify-between w-full">
        <div className="flex items-center gap-3">
          <button className="w-10 h-10 rounded-full bg-white dark:bg-gray-800 flex items-center justify-center text-black dark:text-white shadow-sm border border-gray-200 dark:border-transparent">
            <HomeIcon size={20} />
          </button>
          <button 
            onClick={() => setActiveSubTab('editorial')}
            className={`px-5 h-10 rounded-full text-[15px] font-semibold transition-all ${activeSubTab === 'editorial' ? 'bg-black text-white dark:bg-white dark:text-black shadow-md' : 'bg-transparent text-gray-500 hover:bg-black/5 dark:hover:bg-white/5'}`}
          >
            Selección editorial
          </button>
          <button 
            onClick={() => setActiveSubTab('parati')}
            className={`px-5 h-10 rounded-full text-[15px] font-semibold transition-all ${activeSubTab === 'parati' ? 'bg-black text-white dark:bg-white dark:text-black shadow-md' : 'bg-transparent text-gray-500 hover:bg-black/5 dark:hover:bg-white/5'}`}
          >
            Para ti
          </button>
        </div>
        <button className="w-10 h-10 rounded-full flex items-center justify-center text-gray-500 hover:text-black dark:hover:text-white transition-colors">
          <SlidersHorizontal size={20} strokeWidth={2.5} />
        </button>
      </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="animate-spin text-gray-400" size={32} />
        </div>
      ) : (
        <div className="pb-8">
          {activeSubTab === 'parati' ? (
            <ParaTiSection 
              editorPicks={editorPicks} 
              playlists={playlists} 
              onItemClick={(id, type) => setActiveItem({id, type})} 
            />
          ) : activeSubTab === 'editorial' ? (
            <div className="h-full">
              {/* Carrusel de Píldoras Editoriales */}
              <div className="flex overflow-x-auto px-5 py-4 gap-2 no-scrollbar border-b border-black/5 dark:border-white/5 mb-2">
                {['Lanzamientos', 'Audio Hi-Res', 'Pop', 'Jazz', 'Clásica', 'Electrónica', 'Relajación'].map((tag, idx) => (
                  <button key={tag} onClick={() => setActiveCategory(tag)} className={`px-4 py-1.5 rounded-full text-[13px] font-bold whitespace-nowrap ${activeCategory === tag ? 'bg-black text-white dark:bg-white dark:text-black' : 'bg-black/5 dark:bg-white/10 text-gray-700 dark:text-gray-300'}`}>
                    {tag}
                  </button>
                ))}

              </div>

              {categoryLoading ? (
                <div className="flex flex-col items-center justify-center py-20 opacity-50">
                   <Loader2 className="w-8 h-8 animate-spin mb-4" />
                   <p className="text-sm font-semibold">Cargando {activeCategory}...</p>
                </div>
              ) : (
                <>
                  {/* Novedades / Álbumes de la semana */}

              {renderSectionHeader("Álbumes de la semana", "Los álbumes más interesantes de la semana.")}
              <div className="flex overflow-x-auto pb-8 px-5 gap-5 no-scrollbar">
                {editorPicks.slice(0, 8).map((item) => (
                  <div 
                    key={item.id} 
                    className="flex-none w-[180px] cursor-pointer group"
                    onClick={() => setActiveItem({id: item.id.toString(), type: 'album'})}
                  >
                    <div className="relative aspect-square mb-3 rounded-lg overflow-hidden bg-gray-200 dark:bg-gray-800">
                      <img src={getImageSrc(item.image)} alt={item.title} className="w-full h-full object-cover" onError={(e) => { e.currentTarget.src = 'https://placehold.co/400x400/1C1C1E/FFFFFF/png?text = Audio' }} />
                      <div className="absolute bottom-3 left-3 bg-[#E15328]/90 backdrop-blur-md text-white text-[10px] font-black tracking-wider px-2 py-1 rounded shadow-lg flex items-center gap-1 uppercase">
                        <Disc size={10} /> ÁLBUM DE LA SEMANA
                      </div>
                    </div>
                    <div className="flex justify-between items-start gap-2">
                      <div>
                        <h3 className="font-semibold text-[15px] line-clamp-1 leading-tight">{item.title}</h3>
                        <div className="flex items-center gap-1 mt-0.5">
                          <span className="bg-gray-200 dark:bg-gray-800 text-[10px] font-bold px-1 rounded text-gray-500">E</span>
                          <p className="text-[13px] text-gray-500 dark:text-gray-400 line-clamp-1">{item.artist?.name}</p>
                        </div>
                      </div>
                      {item.hires && (
                        <div className="bg-[#FFB800] text-black text-[9px] font-black px-1 py-0.5 rounded uppercase shrink-0 mt-0.5 leading-none">
                          Hi-Res<br/>Audio
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Top Álbumes */}
              {renderSectionHeader("Top Álbumes", "Álbumes más reproducidos en streaming.")}
              <div className="flex overflow-x-auto pb-8 px-5 gap-5 no-scrollbar">
                {Array.from({ length: Math.ceil(mostStreamed.length / 3) }).map((_, colIndex) => (
                  <div key={colIndex} className="flex-none w-[300px] flex flex-col gap-4">
                    {mostStreamed.slice(colIndex * 3, colIndex * 3 + 3).map((item, rowIdx) => {
                      const globalIdx = colIndex * 3 + rowIdx + 1;
                      return (
                        <div 
                          key={item.id} 
                          className="flex items-center gap-4 cursor-pointer group"
                          onClick={() => setActiveItem({id: item.id.toString(), type: 'album'})}
                        >
                          <div className="w-10 flex-shrink-0 flex items-center justify-start">
                            <span className="text-[32px] font-black tracking-tighter text-gray-300 dark:text-gray-700/80">
                              {globalIdx < 10 ? `0${globalIdx}` : globalIdx}
                            </span>
                          </div>
                          <div className="relative w-[70px] h-[70px] rounded-lg shadow-sm overflow-hidden shrink-0">
                            <img src={getImageSrc(item.image)} alt={item.title} className="w-full h-full object-cover" onError={(e) => { e.currentTarget.src = 'https://placehold.co/400x400/1C1C1E/FFFFFF/png?text = Audio' }} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-[15px] line-clamp-1">{item.title}</h3>
                            <div className="flex items-center gap-1 mt-0.5">
                              <span className="bg-gray-200 dark:bg-gray-800 text-[10px] font-bold px-1 rounded text-gray-500">E</span>
                              <p className="text-[13px] text-gray-500 dark:text-gray-400 line-clamp-1">{item.artist?.name}</p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>

              {/* Playlists de Qobuz */}
              {renderSectionHeader("Playlists de Qobuz", "Seleccionado por nuestros expertos.")}
              <div className="flex overflow-x-auto pb-8 px-5 gap-5 no-scrollbar">
                {playlists.map((item) => (
                  <div key={item.id} onClick={() => setActiveItem({id: item.id.toString(), type: "playlist"})} className="flex-none w-[180px] cursor-pointer group">
                    <div className="relative aspect-square mb-3 rounded-lg overflow-hidden bg-gray-200 dark:bg-gray-800">
                      {item.images300 && item.images300.length === 4 ? (
                        <div className="grid grid-cols-2 w-full h-full">
                          <img src={getImageSrc(item.images300[0])} alt={item.name} className="w-full h-full object-cover" onError={(e) => { e.currentTarget.src = 'https://placehold.co/400x400/1C1C1E/FFFFFF/png?text = Audio' }} />
                          <img src={getImageSrc(item.images300[1])} alt={item.name} className="w-full h-full object-cover" onError={(e) => { e.currentTarget.src = 'https://placehold.co/400x400/1C1C1E/FFFFFF/png?text = Audio' }} />
                          <img src={getImageSrc(item.images300[2])} alt={item.name} className="w-full h-full object-cover" onError={(e) => { e.currentTarget.src = 'https://placehold.co/400x400/1C1C1E/FFFFFF/png?text = Audio' }} />
                          <img src={getImageSrc(item.images300[3])} alt={item.name} className="w-full h-full object-cover" onError={(e) => { e.currentTarget.src = 'https://placehold.co/400x400/1C1C1E/FFFFFF/png?text = Audio' }} />
                        </div>
                      ) : item.images300 && item.images300.length > 0 ? (
                        <img src={getImageSrc(item.images300[0])} alt={item.name} className="w-full h-full object-cover" onError={(e) => { e.currentTarget.src = 'https://placehold.co/400x400/1C1C1E/FFFFFF/png?text = Audio' }} />
                      ) : (
                        <img src={getImageSrc(item.image) || getImageSrc(item.image_rectangle?.[0]) || ""} alt={item.name} className="w-full h-full object-cover" onError={(e) => { e.currentTarget.src = 'https://placehold.co/400x400/1C1C1E/FFFFFF/png?text = Audio' }} />
                      )}
                    </div>
                    <h3 className="font-semibold text-[15px] line-clamp-1 leading-tight">{item.name}</h3>
                    <p className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase mt-1">SELECCIÓN DEL EQUIPO</p>
                  </div>
                ))}
              </div>

              {/* Playlists por categoría */}
              {renderSectionHeader("Playlists por categoría", "Perfectas para cada momento.")}
              <div className="flex overflow-x-auto pb-8 px-5 gap-5 no-scrollbar">
                {[
                  { title: 'Hi-Res', color: 'from-[#D9772F] to-[#E59858]' },
                  { title: 'Foco', color: 'from-[#5433C4] to-[#7B5EE3]' },
                  { title: 'Novedades', color: 'from-[#C43343] to-[#E35E6D]' },
                  { title: 'Humores', color: 'from-[#D96B2F] to-[#E58D58]' },
                  { title: 'Relax', color: 'from-[#3381C4] to-[#5EA1E3]' }
                ].map((cat, i) => (
                  <div key={cat.title} onClick={() => setActiveItem({id: (playlists[i + 5]?.id || playlists[0]?.id || "").toString(), type: "playlist"})} className="flex-none w-[160px] aspect-[4/3] rounded-lg overflow-hidden relative cursor-pointer">
                    <div className={`absolute inset-0 bg-gradient-to-br ${cat.color} opacity-90`} />
                    <h3 className="absolute bottom-3 left-3 text-white font-bold text-lg">{cat.title}</h3>
                  </div>
                ))}
              </div>

              {/* Canta al ritmo de la letra */}
              {renderSectionHeader("Canta al ritmo de la letra", "Vuelve a descubrir tus canciones favoritas con la letra ahora disponible en el reproductor.")}
              <div className="flex overflow-x-auto pb-8 px-5 gap-5 no-scrollbar">
                {[
                  { title: 'Karaoke - Reggaeton', bg: 'bg-[#B07348]', id: playlists[3]?.id || playlists[0]?.id || "" },
                  { title: 'Karaoke - Años 1980', bg: 'bg-[#8F3B55]', id: playlists[4]?.id || playlists[0]?.id || "" },
                  { title: 'Karaoke - Pop Español', bg: 'bg-[#B05B7C]', id: playlists[5]?.id || playlists[0]?.id || "" }
                ].map((karaoke) => (
                  <div key={karaoke.title} onClick={() => setActiveItem({id: (karaoke.id || playlists[0]?.id || "").toString(), type: "playlist"})} className="flex-none w-[200px] cursor-pointer group">
                    <div className={`relative aspect-square mb-3 rounded-lg overflow-hidden ${karaoke.bg} flex items-center justify-center`}>
                      <div className="text-white text-3xl font-black italic shadow-sm tracking-tighter">
                        KARAOKE
                      </div>
                    </div>
                    <h3 className="font-semibold text-[15px] line-clamp-1 leading-tight">{karaoke.title}</h3>
                    <p className="text-[11px] font-semibold text-gray-500 uppercase mt-1">KARAOKE</p>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
          ) : (
            <div className="h-full">
              {/* Para ti Content */}
              {renderSectionHeader("Tu música", "Sigue escuchando y descubre más.")}
              <div className="flex overflow-x-auto pb-8 px-5 gap-5 no-scrollbar">
                
                {/* My Weekly Q */}
                <div onClick={() => setActiveItem({id: (playlists[0]?.id || "").toString(), type: "playlist"})} className="flex-none w-[280px] aspect-[16/9] rounded-xl overflow-hidden relative cursor-pointer group">
                  <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 to-purple-800 opacity-95 transition-transform group-hover:scale-105 duration-500" />
                  <div className="absolute inset-0 p-5 flex flex-col justify-between">
                    <div>
                      <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur flex items-center justify-center mb-2">
                        <Heart size={16} className="text-white fill-white" />
                      </div>
                      <h3 className="text-white font-bold text-xl leading-tight">My Weekly Q</h3>
                      <p className="text-white/80 text-[13px] mt-1 line-clamp-2">Una mezcla basada en tus últimos descubrimientos.</p>
                    </div>
                    <div className="flex items-center gap-2 text-white/90 text-xs font-semibold uppercase">
                      <Play size={12} className="fill-white" /> Escuchar
                    </div>
                  </div>
                </div>

                {/* Nuevos lanzamientos para ti */}
                <div onClick={() => setActiveItem({id: (playlists[1]?.id || "").toString(), type: "playlist"})} className="flex-none w-[280px] aspect-[16/9] rounded-xl overflow-hidden relative cursor-pointer group">
                  <div className="absolute inset-0 bg-gradient-to-br from-emerald-600 to-teal-800 opacity-95 transition-transform group-hover:scale-105 duration-500" />
                  <div className="absolute inset-0 p-5 flex flex-col justify-between">
                    <div>
                      <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur flex items-center justify-center mb-2">
                        <Disc size={16} className="text-white" />
                      </div>
                      <h3 className="text-white font-bold text-xl leading-tight">Lanzamientos para ti</h3>
                      <p className="text-white/80 text-[13px] mt-1 line-clamp-2">Lo nuevo de los artistas que te gustan.</p>
                    </div>
                    <div className="flex items-center gap-2 text-white/90 text-xs font-semibold uppercase">
                      <Play size={12} className="fill-white" /> Escuchar
                    </div>
                  </div>
                </div>

              </div>

              {renderSectionHeader("Mixes basados en tus gustos")}
              <div className="flex overflow-x-auto pb-8 px-5 gap-5 no-scrollbar">
                {playlists.slice(0, 5).map((item, idx) => (
                  <div key={item.id + 'mix'} onClick={() => setActiveItem({id: item.id.toString(), type: "playlist"})} className="flex-none w-[180px] cursor-pointer group">
                    <div className="relative aspect-square mb-3 rounded-lg overflow-hidden bg-gray-200 dark:bg-gray-800">
                      {item.images300 && item.images300.length === 4 ? (
                        <div className="grid grid-cols-2 w-full h-full">
                          <img src={getImageSrc(item.images300[0])} alt={item.name} className="w-full h-full object-cover" onError={(e) => { e.currentTarget.src = 'https://placehold.co/400x400/1C1C1E/FFFFFF/png?text = Audio' }} />
                          <img src={getImageSrc(item.images300[1])} alt={item.name} className="w-full h-full object-cover" onError={(e) => { e.currentTarget.src = 'https://placehold.co/400x400/1C1C1E/FFFFFF/png?text = Audio' }} />
                          <img src={getImageSrc(item.images300[2])} alt={item.name} className="w-full h-full object-cover" onError={(e) => { e.currentTarget.src = 'https://placehold.co/400x400/1C1C1E/FFFFFF/png?text = Audio' }} />
                          <img src={getImageSrc(item.images300[3])} alt={item.name} className="w-full h-full object-cover" onError={(e) => { e.currentTarget.src = 'https://placehold.co/400x400/1C1C1E/FFFFFF/png?text = Audio' }} />
                        </div>
                      ) : item.images300 && item.images300.length > 0 ? (
                        <img src={getImageSrc(item.images300[0])} alt={item.name} className="w-full h-full object-cover" onError={(e) => { e.currentTarget.src = 'https://placehold.co/400x400/1C1C1E/FFFFFF/png?text = Audio' }} />
                      ) : (
                        <img src={getImageSrc(item.image) || getImageSrc(item.image_rectangle?.[0]) || ""} alt={item.name} className="w-full h-full object-cover" onError={(e) => { e.currentTarget.src = 'https://placehold.co/400x400/1C1C1E/FFFFFF/png?text = Audio' }} />
                      )}
                      
                      <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                         <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-lg transform scale-90 group-hover:scale-100 transition-transform">
                           <Play className="fill-black text-black ml-1" size={20} />
                         </div>
                      </div>
                    </div>
                    <h3 className="font-semibold text-[15px] line-clamp-1 leading-tight">Mix {idx + 1}</h3>
                    <p className="text-[13px] text-gray-500 dark:text-gray-400 line-clamp-1">{item.name}</p>
                  </div>
                ))}
              </div>
              
              {renderSectionHeader("Artistas similares a lo que escuchas")}
              <div className="flex overflow-x-auto pb-8 px-5 gap-5 no-scrollbar">
                {mostStreamed.slice(0, 6).map((item) => (
                  <div key={item.id + 'artist'} onClick={() => setActiveItem({id: item.id.toString(), type: "album"})} className="flex-none w-[160px] cursor-pointer group flex flex-col items-center text-center">
                    <div className="relative w-28 h-28 mb-3 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-800 border shadow-sm">
                      <img src={getImageSrc(item.image)} alt={item.artist?.name} className="w-full h-full object-cover" onError={(e) => { e.currentTarget.src = 'https://placehold.co/400x400/1C1C1E/FFFFFF/png?text = Audio' }} />
                    </div>
                    <h3 className="font-semibold text-[15px] line-clamp-1 leading-tight w-full">{item.artist?.name}</h3>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
    </>
  );
}
