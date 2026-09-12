import { searchQobuz } from "../lib/qobuz";
import { useState, useRef, useEffect } from 'react';
import type { FormEvent } from 'react';
import { Search as SearchIcon, Download, Disc, Music, Loader2, Play, X, MoreHorizontal } from 'lucide-react';
import { usePlayer } from './PlayerContext';
import AlbumView from './AlbumView';
import PlaylistView from './PlaylistView';
import { AnimatePresence, motion } from 'motion/react';
import { useIntersectionObserver } from '../hooks/useIntersectionObserver';
import { getImageSrc } from '../lib/image';


interface QobuzItem {
  id: string;
  title: string;
  artist?: { name: string };
  performer?: { name: string };
  image?: { large?: string; small?: string; thumbnail?: string };
  album?: any;
  duration?: number;
  hires?: boolean;
}

const BENTO_GENRES = [
  { id: '1', name: 'Audio Hi-Res', color: 'bg-yellow-500/20 text-yellow-700 dark:text-yellow-500 border-yellow-500/30' },
  { id: '2', name: 'Novedades', color: 'bg-blue-500/20 text-blue-700 dark:text-blue-500 border-blue-500/30' },
  { id: '3', name: 'Pop', color: 'bg-pink-500/20 text-pink-700 dark:text-pink-500 border-pink-500/30' },
  { id: '4', name: 'Hip-Hop', color: 'bg-purple-500/20 text-purple-700 dark:text-purple-500 border-purple-500/30' },
  { id: '5', name: 'Electrónica', color: 'bg-green-500/20 text-green-700 dark:text-green-500 border-green-500/30' },
  { id: '6', name: 'Rock', color: 'bg-red-500/20 text-red-700 dark:text-red-500 border-red-500/30' },
  { id: '7', name: 'Jazz', color: 'bg-orange-500/20 text-orange-700 dark:text-orange-500 border-orange-500/30' },
  { id: '8', name: 'Clásica', color: 'bg-teal-500/20 text-teal-700 dark:text-teal-500 border-teal-500/30' },
];

export default function SearchTab() {
  const containerVariants = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.08 } } };
  const itemVariants = { hidden: { opacity: 0, y: 15 }, show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 400, damping: 30 } } };

  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [error, setError] = useState('');
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [offset, setOffset] = useState(0);
  const { targetRef, isIntersecting } = useIntersectionObserver({ threshold: 0.1 });
  const { playTrack, currentTrack, isPlaying, setContextMenuTrack, setDownloadItem } = usePlayer();
  
  const [activeItem, setActiveItem] = useState<{id: string, type: string} | null>(null);
  const [isFocused, setIsFocused] = useState(false);
  const [filterMode, setFilterMode] = useState<'all' | 'albums' | 'tracks' | 'artists'>('all');
  
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (query.trim()) {
        executeSearch(query);
      } else {
        setResults(null);
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [query]);

  const executeSearch = async (searchQuery: string, currentOffset = 0) => {
    if (currentOffset === 0) {
      setLoading(true);
      setOffset(0);
    } else {
      setLoadingMore(true);
    }
    setError('');
    try {
      let typeParam = undefined;
      if (currentOffset > 0 && filterMode !== 'all') {
        typeParam = filterMode;
      }
      
      const data = await searchQobuz(searchQuery, 50, currentOffset, typeParam);
      if (currentOffset === 0) {
        setResults(data);
      } else {
        setResults((prev: any) => ({
          ...prev,
          tracks: {
            ...prev.tracks,
            items: [...(prev.tracks?.items || []), ...(data.tracks?.items || [])]
          },
          albums: {
            ...prev.albums,
            items: [...(prev.albums?.items || []), ...(data.albums?.items || [])]
          },
          artists: {
            ...prev.artists,
            items: [...(prev.artists?.items || []), ...(data.artists?.items || [])]
          }
        }));
      }
      
      let total = 0;
      let loaded = 0;
      if (filterMode === 'tracks') {
        total = data.tracks?.total || 0;
        loaded = currentOffset + (data.tracks?.items?.length || 0);
        setHasMore(loaded < total);
      } else if (filterMode === 'albums') {
        total = data.albums?.total || 0;
        loaded = currentOffset + (data.albums?.items?.length || 0);
        setHasMore(loaded < total);
      } else if (filterMode === 'artists') {
        total = data.artists?.total || 0;
        loaded = currentOffset + (data.artists?.items?.length || 0);
        setHasMore(loaded < total);
      } else {
        setHasMore(false); // No pagination in 'all' view
      }
      
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Error occurred');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    if (isIntersecting && hasMore && !loading && !loadingMore) {
      executeSearch(query, offset);
    }
  }, [isIntersecting, hasMore, loading, loadingMore, filterMode, query, offset]);

  useEffect(() => {
    if (!results) return;
    let total = 0;
    let loaded = 0;
    if (filterMode === 'tracks') {
      total = results.tracks?.total || 0;
      loaded = results.tracks?.items?.length || 0;
      setHasMore(loaded < total);
    } else if (filterMode === 'albums') {
      total = results.albums?.total || 0;
      loaded = results.albums?.items?.length || 0;
      setHasMore(loaded < total);
    } else if (filterMode === 'artists') {
      total = results.artists?.total || 0;
      loaded = results.artists?.items?.length || 0;
      setHasMore(loaded < total);
    } else {
      setHasMore(false);
    }
    setOffset(loaded);
  }, [filterMode, results]);

  const handleSearch = (e: FormEvent) => {
    e.preventDefault();
    if (query.trim()) executeSearch(query);
  };

  const handlePlay = (track: any) => {
    const queue = results?.tracks?.items?.map((t: any) => ({
      id: t.id.toString(),
      title: t.title,
      artist: t.performer?.name || t.artist?.name || 'Unknown',
      image: t.album?.image?.large || t.album?.image?.small || t.image?.small || '',
      hires: t.hires || t.maximum_bit_depth > 16 || false,
      duration: t.duration || 0,
      albumTitle: t.album?.title
    })) || [track];
    
    const trackToPlay = queue.find((t: any) => t.id === track.id.toString()) || queue[0];
    if (trackToPlay) playTrack(trackToPlay, queue);
  };

  const topHit = results?.albums?.items?.[0] || results?.tracks?.items?.[0];

  return (
    <div className="h-full w-full bg-[#F2F2F7] dark:bg-[#000000] relative">
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
      </AnimatePresence>

      <div className="flex flex-col h-full pb-[180px] overflow-y-auto">
        {/* Header and Search Bar */}
        <header className="sticky top-0 z-40 bg-[#F2F2F7]/90 dark:bg-[#000000]/90 backdrop-blur-2xl px-5 pt-14 pb-4 border-b border-black/5 dark:border-white/5">
          {!isFocused && !query && (
            <h1 className="text-3xl font-black tracking-tighter text-black dark:text-white mb-4">Buscar</h1>
          )}
          
          <div className="flex items-center gap-3">
            <form onSubmit={handleSearch} className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <SearchIcon className="h-5 w-5 text-gray-400 dark:text-gray-500" />
              </div>
              <input
                ref={inputRef}
                type="text"
                className="block w-full pl-11 pr-10 py-3 bg-black/5 dark:bg-white/10 border-none rounded-2xl text-[17px] text-black dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-[#007AFF] transition-all shadow-inner"
                placeholder="Álbumes, artistas, canciones..."
                value={query}
                onFocus={() => setIsFocused(true)}
                onChange={(e) => setQuery(e.target.value)}
              />
              {query && (
                <button 
                  type="button"
                  onClick={() => { setQuery(''); inputRef.current?.focus(); }}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center"
                >
                  <X className="h-5 w-5 text-gray-400" />
                </button>
              )}
            </form>
            <AnimatePresence>
              {(isFocused || query) && (
                <motion.button
                  initial={{ width: 0, opacity: 0 }}
                  animate={{ width: 'auto', opacity: 1 }}
                  exit={{ width: 0, opacity: 0 }}
                  onClick={() => {
                    setIsFocused(false);
                    setQuery('');
                    setResults(null);
                  }}
                  className="text-[#007AFF] font-medium text-[17px] whitespace-nowrap overflow-hidden"
                >
                  Cancelar
                </motion.button>
              )}
            </AnimatePresence>
          </div>
        </header>

        <div className="flex-1 px-5 pt-4">
          
          {/* STATE 1: Empty (Bento Grid Discovery) */}
          {!query && !results && !loading && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-2">
              <h2 className="text-xl font-black tracking-tighter mb-4 text-black dark:text-white">Explorar géneros</h2>
              <div className="grid grid-cols-2 gap-4">
                {BENTO_GENRES.map((genre, idx) => (
                  <div 
                    key={genre.id} 
                    onClick={() => { setQuery(genre.name); setIsFocused(false); executeSearch(genre.name); }}
                    className={`relative aspect-[4/3] rounded-2xl p-4 flex flex-col justify-end border ${genre.color} cursor-pointer hover:scale-[1.02] active:scale-95 transition-transform shadow-sm overflow-hidden`}
                  >
                    <span className="font-bold text-lg leading-tight">{genre.name}</span>
                  </div>
                ))}
              </div>
              {hasMore && (
                <div ref={targetRef} className="py-6 flex justify-center">
                  <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                </div>
              )}
            </motion.div>
          )}

          {/* STATE 2: Loading */}
          {loading && (
            <div className="flex flex-col items-center justify-center h-64 text-gray-400">
              <Loader2 className="w-8 h-8 animate-spin mb-4 text-[#007AFF]" />
              <p className="font-medium">Buscando...</p>
            </div>
          )}

          {/* STATE 3: Error */}
          {error && !loading && (
            <div className="p-4 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-xl text-sm border border-red-100 dark:border-red-900/50 mt-4">
              <p className="font-bold mb-1">Error al buscar</p>
              <p>{error}</p>
            </div>
          )}

          {/* STATE 4: Results */}
          {results && !loading && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              
              {/* Filter Pills */}
              <div className="flex gap-2 overflow-x-auto no-scrollbar mb-6 pb-2">
                {['all', 'albums', 'tracks', 'artists'].map(mode => (
                  <button 
                    key={mode}
                    onClick={() => setFilterMode(mode as any)}
                    className={`px-5 py-2 rounded-full text-[14px] font-bold whitespace-nowrap transition-colors ${filterMode === mode ? 'bg-black text-white dark:bg-white dark:text-black shadow-md' : 'bg-black/5 dark:bg-white/10 text-gray-600 dark:text-gray-300'}`}
                  >
                    {mode === 'all' ? 'Todo' : mode === 'albums' ? 'Álbumes' : mode === 'tracks' ? 'Pistas' : 'Artistas'}
                  </button>
                ))}
              </div>

              {/* Top Hit Card (Mejor Resultado) */}
              {(filterMode === 'all' && topHit) && (
                <div className="mb-8">
                  <h2 className="text-xl font-black tracking-tighter mb-3 text-black dark:text-white">Mejor resultado</h2>
                  <div 
                    onClick={() => topHit.duration ? handlePlay(topHit) : setActiveItem({id: topHit.id.toString(), type: 'album'})}
                    className="bg-white/60 dark:bg-white/5 rounded-3xl p-5 border border-black/5 dark:border-white/5 shadow-lg flex flex-col gap-4 cursor-pointer hover:bg-white dark:hover:bg-white/10 transition-colors relative overflow-hidden group"
                  >
                    <div className="absolute top-0 right-0 p-6 opacity-10 blur-xl pointer-events-none transform translate-x-1/4 -translate-y-1/4">
                      {getImageSrc(topHit.image) && <img src={getImageSrc(topHit.image) || ""} alt="" className="w-48 h-48 rounded-full" />}
                    </div>
                    
                    <div className="w-24 h-24 rounded-2xl overflow-hidden bg-gray-200 dark:bg-gray-800 shadow-md">
                      <img src={getImageSrc(topHit.image) || getImageSrc(topHit.album?.image) || ''} alt={topHit.title} className="w-full h-full object-cover" />
                    </div>
                    
                    <div className="relative z-10 pr-12">
                      <h3 className="text-2xl font-black tracking-tighter line-clamp-1">{topHit.title}</h3>
                      <p className="text-[15px] font-medium text-gray-500 mt-1">{topHit.artist?.name || topHit.performer?.name}</p>
                      <div className="mt-2 inline-flex bg-black/5 dark:bg-white/10 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-widest text-gray-500">
                        {topHit.duration ? 'Pista' : 'Álbum'}
                      </div>
                    </div>

                    <button 
                      onClick={(e) => { e.stopPropagation(); topHit.duration ? handlePlay(topHit) : setActiveItem({id: topHit.id.toString(), type: 'album'}) }}
                      className="absolute bottom-5 right-5 w-12 h-12 bg-[#007AFF] text-white rounded-full flex items-center justify-center shadow-xl group-hover:scale-105 active:scale-95 transition-transform"
                    >
                      <Play className="w-6 h-6 fill-current ml-1" />
                    </button>
                  </div>
                </div>
              )}

              {/* Albums List */}
              {(filterMode === 'all' || filterMode === 'albums') && results.albums?.items && results.albums.items.length > 0 && (
                <section className="mb-8">
                  <h2 className="text-xl font-black tracking-tighter mb-4 text-black dark:text-white">Álbumes</h2>
                  <motion.div variants={containerVariants} initial="hidden" animate="show" className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-6">
                    {results.albums.items.slice(0, filterMode === 'albums' ? undefined : 8).map((album: any) => (
                      <motion.div variants={itemVariants} key={album.id} onClick={() => setActiveItem({id: album.id.toString(), type: 'album'})} className="flex flex-col gap-2 group cursor-pointer">
                        <div className="relative aspect-square rounded-xl bg-gray-200 dark:bg-gray-800 shadow-sm overflow-hidden">
                          {album.image?.large ? (
                            <img src={getImageSrc(album.image) || ''} alt={album.title} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400"><Disc className="w-8 h-8" /></div>
                          )}
                          <div className="absolute inset-0 bg-black/20 opacity-100 transition-opacity" />
                        </div>
                        <div>
                          <p className="font-bold text-[14px] leading-tight truncate">{album.title}</p>
                          <p className="text-gray-500 text-[13px] truncate mt-0.5">{album.artist?.name}</p>
                        </div>
                      </motion.div>
                    ))}
                  </motion.div>
                </section>
              )}

              {/* Artists List */}
              {(filterMode === 'all' || filterMode === 'artists') && results.artists?.items && results.artists.items.length > 0 && (
                <section className="mb-8">
                  <h2 className="text-xl font-black tracking-tighter mb-4 text-black dark:text-white">Artistas</h2>
                  <motion.div variants={containerVariants} initial="hidden" animate="show" className="flex gap-4 overflow-x-auto no-scrollbar pb-4">
                    {results.artists.items.slice(0, filterMode === 'artists' ? undefined : 6).map((artist: any) => (
                      <motion.div variants={itemVariants} key={artist.id} onClick={() => { setQuery(artist.name); setIsFocused(false); executeSearch(artist.name); }} className="flex-none w-[100px] flex flex-col items-center gap-2 cursor-pointer group">
                        <div className="w-[90px] h-[90px] rounded-full bg-gray-200 dark:bg-gray-800 shadow-sm overflow-hidden border border-black/5 dark:border-white/5 relative">
                          {(artist.picture || artist.image) ? (
                            <img src={getImageSrc(artist.picture) || getImageSrc(artist.image) || ''} alt={artist.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400 font-black text-2xl">
                              {artist.name.charAt(0)}
                            </div>
                          )}
                        </div>
                        <p className="font-bold text-[13px] leading-tight text-center line-clamp-2">{artist.name}</p>
                      </motion.div>
                    ))}
                  </motion.div>
                </section>
              )}

              {/* Tracks List */}
              {(filterMode === 'all' || filterMode === 'tracks') && results.tracks?.items && results.tracks.items.length > 0 && (
                <section className="mb-8">
                  <h2 className="text-xl font-black tracking-tighter mb-4 text-black dark:text-white">Pistas</h2>
                  <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-1 border-t border-black/5 dark:border-white/5 pt-2">
                    {results.tracks.items.slice(0, filterMode === 'tracks' ? undefined : 5).map((track: any) => (
                      <motion.div variants={itemVariants} key={track.id} onClick={() => handlePlay(track)} className="flex items-center space-x-3 p-2 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer group">
                        <div className="w-12 h-12 bg-gray-200 dark:bg-gray-800 rounded-lg overflow-hidden flex-shrink-0 relative">
                          <img src={getImageSrc(track.album?.image) || getImageSrc(track.image) || ''} alt={track.title} className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-100 transition-opacity">
                            <Play className="w-5 h-5 text-white fill-current" />
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`font-bold text-[15px] leading-tight truncate ${currentTrack?.id === track.id.toString() ? 'text-[#007AFF]' : ''}`}>{track.title}</p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            {track.hires && <span className="bg-[#FFB800]/20 text-[#FFB800] text-[8px] font-black px-1 rounded uppercase">Hi-Res</span>}
                            <p className="text-gray-500 text-[13px] truncate">{track.artist?.name || track.performer?.name}</p>
                          </div>
                        </div>
                        <button 
                          onClick={(e) => { e.stopPropagation(); setDownloadItem({item: track, type: 'track'}); }}
                          className="p-2 text-gray-400 hover:text-[#007AFF] transition-colors opacity-100"
                        >
                          <Download className="w-5 h-5" />
                        </button>
                        <button 
                          onClick={(e) => { e.stopPropagation(); setContextMenuTrack({ item: track, type: 'track' }); }}
                          className="p-2 text-gray-400 hover:text-black dark:hover:text-white rounded-full transition-colors opacity-100"
                        >
                          <MoreHorizontal className="w-5 h-5" />
                        </button>
                      </motion.div>
                    ))}
                  </motion.div>
                </section>
              )}

              {hasMore && (
                <div ref={targetRef} className="py-6 flex justify-center">
                  <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                </div>
              )}
            </motion.div>
          )}

        </div>
      </div>
      

    </div>
  );
}
