import { getQobuzArtist } from "../lib/qobuz";
import { useState, useEffect, useRef } from 'react';
import { ChevronLeft, Play, Download, Loader2, Heart, Share, MoreHorizontal, User } from 'lucide-react';
import { usePlayer } from './PlayerContext';
import { useSwipeBack } from '../lib/useSwipeBack';
import { AnimatePresence, motion, useScroll, useTransform } from 'motion/react';
import { getImageSrc } from '../lib/image';
import { useIntersectionObserver } from '../hooks/useIntersectionObserver';

interface ArtistViewProps {
  artistId: string;
  onBack: () => void;
}

export default function ArtistView({ artistId, onBack }: ArtistViewProps) {
  const [artist, setArtist] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [loadingMoreTracks, setLoadingMoreTracks] = useState(false);
  const [hasMoreTracks, setHasMoreTracks] = useState(true);
  const { targetRef, isIntersecting } = useIntersectionObserver({ threshold: 0.1 });
  
  const { playTrack, currentTrack, isPlaying, setContextMenuTrack, setDownloadItem } = usePlayer();
    
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollY } = useScroll({ container: containerRef });
  
  const headerOpacity = useTransform(scrollY, [100, 250], [0, 1]);
  const titleOpacity = useTransform(scrollY, [200, 300], [0, 1]);
  const imageScale = useTransform(scrollY, [0, 300], [1, 0.8]);
  const imageOpacity = useTransform(scrollY, [0, 250], [1, 0.2]);

  useSwipeBack(onBack);

  useEffect(() => {
    const fetchArtist = async () => {
      setLoading(true);
      try {
        const data = await getQobuzArtist(artistId);
        setArtist(data);
        setHasMoreTracks(false);
      } catch (err: any) {
        setError(err.message || 'Failed to load artist');
      } finally {
        setLoading(false);
      }
    };
    fetchArtist();
  }, [artistId]);

  
  useEffect(() => {
    if (isIntersecting && hasMoreTracks && !loading && !loadingMoreTracks && artist) {
      loadMoreTracks();
    }
  }, [isIntersecting, hasMoreTracks, loading, loadingMoreTracks, artist]);

  const loadMoreTracks = async () => {
    if (!artist || !artist.tracks || !artist.tracks.items) return;
    const currentCount = artist.tracks.items.length;
    const total = artist.tracks.total || 9999;
    if (currentCount >= total) {
      setHasMoreTracks(false);
      return;
    }
    setLoadingMoreTracks(true);
    try {
      const data = await getQobuzArtist(artistId, 50, currentCount);
      const newItems = data.tracks?.items || [];
      if (newItems.length === 0) {
        setHasMoreTracks(false);
      } else {
        setArtist((prev: any) => ({
          ...prev,
          tracks: {
            ...prev.tracks,
            items: [...prev.tracks.items, ...newItems]
          }
        }));
        if (currentCount + newItems.length >= total) {
          setHasMoreTracks(false);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingMoreTracks(false);
    }
  };

  const handlePlay = (track: any) => {
    if (!track) return;
    const tracksToPlay = artist?.tracks?.items || [];
    const queue = tracksToPlay.map((t: any) => ({
      id: t.id.toString(),
      title: t.title,
      artist: t.performer?.name || t.artist?.name || artist.name,
      image: t.album?.image?.large || t.album?.image?.small || t.image || artist.picture?.large,
      hires: t.hires || t.maximum_bit_depth > 16 || false,
      duration: t.duration || 0,
      original: t
    }));
    
    const trackToPlay = queue.find((q: any) => q.id === track.id.toString()) || queue[0];
    playTrack(trackToPlay, queue);
  };

  if (loading) {
    return (
      <div ref={containerRef} className="h-full w-full bg-[#F2F2F7] dark:bg-[#000000] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#007AFF]" />
      </div>
    );
  }

  if (error) {
    return (
      <div ref={containerRef} className="h-full w-full bg-[#F2F2F7] dark:bg-[#000000] flex flex-col items-center justify-center p-6 text-center">
        <p className="text-red-500 mb-4">{error}</p>
        <button onClick={onBack} className="px-6 py-2 bg-[#007AFF] text-white rounded-full font-bold">Volver</button>
      </div>
    );
  }

  if (!artist) return <div ref={containerRef} className="h-full w-full bg-[#F2F2F7] dark:bg-[#000000]" />;

  const coverUrl = getImageSrc(artist.picture?.large || artist.picture?.small || artist.image);
  const topTracks = artist.tracks?.items || [];
  const albums = artist.albums?.items || [];

  return (
    <div ref={containerRef} className="h-full w-full overflow-y-auto bg-[#F2F2F7] dark:bg-[#000000] relative pb-[180px]">
      
      {/* Dynamic Background */}
      <div className="absolute top-0 left-0 w-full h-[500px] overflow-hidden -z-10 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-[#F2F2F7]/80 to-[#F2F2F7] dark:from-black/60 dark:via-black/80 dark:to-[#000000] z-10" />
        <img src={coverUrl} alt="" className="w-full h-full object-cover blur-[80px] opacity-60 dark:opacity-40 transform scale-110" />
      </div>

      {/* Sticky Header */}
      <motion.header 
        className="sticky top-0 z-40 px-4 pt-12 pb-3 flex items-center justify-between"
      >
        <motion.div 
          style={{ opacity: headerOpacity }}
          className="absolute inset-0 bg-[#F2F2F7]/90 dark:bg-[#000000]/90 backdrop-blur-xl shadow-sm"
        />
        
        <button 
          onClick={onBack}
          className="relative z-10 w-10 h-10 flex items-center justify-center bg-black/10 dark:bg-white/10 rounded-full backdrop-blur-md text-black dark:text-white"
        >
          <ChevronLeft className="w-6 h-6 -ml-1" />
        </button>

        <motion.div 
          style={{ opacity: titleOpacity }}
          className="relative z-10 flex-1 px-4 text-center"
        >
          <h1 className="text-base font-bold text-black dark:text-white line-clamp-1">{artist.name}</h1>
        </motion.div>

        <div className="w-10 h-10" />
      </motion.header>

      {/* Main Content */}
      <div className="px-5 md:px-8 pt-4">
        
        {/* Hero Section */}
        <div className="flex flex-col items-center text-center mt-2 md:mt-8 mb-8">
          <motion.div 
            style={{ scale: imageScale, opacity: imageOpacity }}
            className="w-56 md:w-72 aspect-square relative rounded-full overflow-hidden shadow-2xl mb-6 bg-gray-200 dark:bg-gray-800 flex items-center justify-center"
          >
            {coverUrl ? <img src={coverUrl} alt={artist.name} className="w-full h-full object-cover" /> : <User size={64} className="text-gray-400" />}
          </motion.div>

          <h1 className="text-3xl md:text-5xl font-black tracking-tighter text-black dark:text-white leading-tight mb-2 max-w-[90%]">
            {artist.name}
          </h1>
          
          <div className="flex items-center gap-4 mb-4">
            <button 
              onClick={() => handlePlay(topTracks[0])}
              className="w-16 h-16 flex items-center justify-center bg-[#007AFF] text-white rounded-full shadow-xl hover:scale-105 transition-transform"
            >
              <Play className="w-7 h-7 fill-current ml-1" />
            </button>
          </div>
        </div>

        {/* Tracks List */}
        {topTracks.length > 0 && (
          <div className="mt-8">
            <h3 className="text-xl font-bold text-black dark:text-white mb-4">Top Canciones</h3>
            <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-1">
              {topTracks.map((track: any, idx: number) => {
                const isCurrent = currentTrack?.id === track.id.toString();
                return (
                  <motion.div variants={itemVariants} 
                    key={track.id}
                    onClick={() => handlePlay(track)}
                    className="flex items-center space-x-4 p-3 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 transition-colors group cursor-pointer"
                  >
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
                      <img src={getImageSrc(track.album?.image?.small || track.image)} alt="" className="w-full h-full object-cover" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <p className={`font-bold text-[15px] leading-snug truncate \${isCurrent ? 'text-[#007AFF]' : 'text-black dark:text-white'}`}>{track.title}</p>
                      <p className="text-gray-500 text-[13px] font-medium truncate mt-0.5">{track.album?.title}</p>
                    </div>

                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={(e) => { e.stopPropagation(); setContextMenuTrack({ item: track, type: 'track' }); }}
                        className="w-10 h-10 flex items-center justify-center text-gray-400 hover:text-black dark:hover:text-white"
                      >
                        <MoreHorizontal className="w-5 h-5" />
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          </div>
        )}

        {/* Albums List */}
        {albums.length > 0 && (
          <div className="mt-8">
            <h3 className="text-xl font-bold text-black dark:text-white mb-4">Álbumes</h3>
            <motion.div variants={containerVariants} initial="hidden" animate="show" className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {albums.map((album: any) => (
                <motion.div variants={itemVariants} 
                  key={album.id}
                  onClick={() => {
                    document.dispatchEvent(new CustomEvent('open-overlay', { detail: { type: 'album', id: album.id || album.qobuz_id } }));
                  }}
                  className="cursor-pointer group"
                >
                  <div className="w-full aspect-square rounded-xl overflow-hidden mb-2 bg-gray-200 dark:bg-gray-800">
                    <img 
                      src={getImageSrc(album.image?.large || album.image?.small)} 
                      alt={album.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform" 
                    />
                  </div>
                  <h4 className="font-bold text-[15px] text-black dark:text-white line-clamp-1">{album.title}</h4>
                  <p className="text-gray-500 text-[13px] font-medium mt-0.5">{new Date(album.released_at * 1000).getFullYear()}</p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        )}

      </div>
    </div>
  );
}
