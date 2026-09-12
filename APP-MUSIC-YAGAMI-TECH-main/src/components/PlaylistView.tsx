import { getQobuzPlaylist } from "../lib/qobuz";
import { useState, useEffect, useRef } from 'react';
import { ChevronLeft, Play, Download, Loader2, Heart, Share, MoreHorizontal } from 'lucide-react';
import { usePlayer } from './PlayerContext';
import { useSwipeBack } from '../lib/useSwipeBack';
import { AnimatePresence, motion, useScroll, useTransform } from 'motion/react';
import { getImageSrc } from '../lib/image';
import { useIntersectionObserver } from '../hooks/useIntersectionObserver';


interface PlaylistViewProps {
  playlistId: string;
  onBack: () => void;
}

export default function PlaylistView({ playlistId, onBack }: PlaylistViewProps) {
  const [playlist, setPlaylist] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const { targetRef, isIntersecting } = useIntersectionObserver({ threshold: 0.1 });
  const { playTrack, currentTrack, isPlaying, setContextMenuTrack, setDownloadItem } = usePlayer();
  
  
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollY } = useScroll({ container: containerRef });
  
  // Parallax and fade effects based on scroll
  const headerOpacity = useTransform(scrollY, [100, 250], [0, 1]);
  const titleOpacity = useTransform(scrollY, [200, 300], [0, 1]);
  const imageScale = useTransform(scrollY, [0, 300], [1, 0.8]);
  const imageOpacity = useTransform(scrollY, [0, 250], [1, 0.2]);

  useSwipeBack(onBack);

  useEffect(() => {
    const fetchPlaylist = async () => {
      setLoading(true);
      try {
        const data = await getQobuzPlaylist(playlistId);
        setPlaylist(data);
        setHasMore((data.tracks?.items?.length || 0) < data.tracks_count);
      } catch (err: any) {
        setError(err.response?.data?.error || err.message || 'Failed to load playlist');
      } finally {
        setLoading(false);
      }
    };
    fetchPlaylist();
  }, [playlistId]);

  
  useEffect(() => {
    if (isIntersecting && hasMore && !loading && !loadingMore) {
      loadMoreTracks();
    }
  }, [isIntersecting, hasMore, loading, loadingMore]);

  const loadMoreTracks = async () => {
    if (!playlist || !playlist.tracks || !playlist.tracks.items) return;
    const currentCount = playlist.tracks.items.length;
    if (currentCount >= playlist.tracks_count) {
      setHasMore(false);
      return;
    }
    setLoadingMore(true);
    try {
      const data = await getQobuzPlaylist(playlistId, 50, currentCount);
      const newItems = data.tracks?.items || [];
      if (newItems.length === 0) {
        setHasMore(false);
      } else {
        setPlaylist((prev: any) => ({
          ...prev,
          tracks: {
            ...prev.tracks,
            items: [...prev.tracks.items, ...newItems]
          }
        }));
        if (currentCount + newItems.length >= playlist.tracks_count) {
          setHasMore(false);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingMore(false);
    }
  };

  const handlePlay = (track: any) => {
    const queue = playlist.tracks?.items?.map((t: any) => ({
      id: t.id.toString(),
      title: t.title,
      artist: t.performer?.name || t.artist?.name || 'Unknown Artist',
      image: t.album?.image?.large || t.album?.image?.small || '',
      hires: t.hires || t.maximum_bit_depth > 16 || false,
      duration: t.duration || 0,
      bitDepth: t.maximum_bit_depth,
      samplingRate: t.maximum_sampling_rate,
      albumTitle: t.album?.title,
      releaseDate: t.release_date_original || t.release_date_stream,
      composer: t.composer?.name,
      copyright: t.copyright
    })) || [];
    const trackToPlay = track ? (queue.find((t: any) => t.id === track.id.toString()) || queue[0]) : queue[0];
    if (trackToPlay) playTrack(trackToPlay, queue);
  };

  const getPlaylistImage = () => {
    if (!playlist) return null;
    if (playlist.images300 && playlist.images300.length > 0) return playlist.images300[0];
    if (playlist.image_rectangle && playlist.image_rectangle.length > 0) return playlist.image_rectangle[0];
    return playlist.image?.large || playlist.image?.small;
  };

  const mainImage = getImageSrc(getPlaylistImage());

  return (
    <div ref={containerRef} className="h-full w-full overflow-y-auto bg-[#F2F2F7] dark:bg-[#000000] relative">
      {loading ? (
        <div className="flex flex-col items-center justify-center min-h-[500px] h-full text-gray-400">
          <Loader2 className="w-8 h-8 animate-spin mb-4 text-[#007AFF]" />
          <p>Cargando playlist...</p>
        </div>
      ) : error || !playlist ? (
        <div className="p-8 pt-16 h-full">
          <button onClick={onBack} className="flex items-center text-[#007AFF] mb-4">
            <ChevronLeft className="w-5 h-5 mr-1" /> Volver
          </button>
          <div className="p-4 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-xl text-sm">
            <p className="font-semibold mb-1">Error</p>
            <p>{error}</p>
          </div>
        </div>
      ) : (
        <>
      
      {/* Blurred background cover */}
      <div className="absolute top-0 left-0 w-full h-[500px] overflow-hidden -z-10 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-[#F2F2F7]/80 to-[#F2F2F7] dark:from-black/60 dark:via-black/80 dark:to-[#000000] z-10" />
        {mainImage && (
          <img src={mainImage} alt="" className="w-full h-full object-cover blur-[80px] opacity-60 dark:opacity-40 transform scale-110" />
        )}
      </div>

      {/* Sticky Header */}
      <motion.header 
        style={{ backgroundColor: 'rgba(var(--bg-color), var(--opacity))' }}
        className="sticky top-0 z-40 px-4 pt-12 pb-3 flex items-center justify-between"
      >
        <motion.div style={{ opacity: headerOpacity }} className="absolute inset-0 bg-[#F2F2F7] dark:bg-[#000000] shadow-sm" />
        <button onClick={onBack} className="relative z-10 w-10 h-10 flex items-center justify-center bg-black/10 dark:bg-white/10 rounded-full backdrop-blur-md text-black dark:text-white">
          <ChevronLeft className="w-6 h-6 -ml-1" />
        </button>
        
        <motion.div style={{ opacity: titleOpacity }} className="relative z-10 flex-1 px-4 text-center">
          <h1 className="text-base font-bold text-black dark:text-white line-clamp-1">{playlist.name}</h1>
        </motion.div>

        <button className="relative z-10 w-10 h-10 flex items-center justify-center bg-black/10 dark:bg-white/10 rounded-full backdrop-blur-md text-black dark:text-white">
          <MoreHorizontal className="w-5 h-5" />
        </button>
      </motion.header>

      {/* Content */}
      <div className="px-5 md:px-8 pt-4 pb-24">
        
        {/* Editorial Hero Layout */}
        <div className="flex flex-col items-center text-center mt-2 md:mt-8 mb-8">
          <motion.div style={{ scale: imageScale, opacity: imageOpacity }} className="w-56 md:w-72 aspect-square relative rounded-2xl md:rounded-3xl overflow-hidden shadow-2xl mb-6 bg-gray-200 dark:bg-gray-800">
            {playlist.images300 && playlist.images300.length === 4 ? (
              <div className="grid grid-cols-2 w-full h-full">
                <img src={getImageSrc(playlist.images300[0])} alt={playlist.name} className="w-full h-full object-cover" />
                <img src={getImageSrc(playlist.images300[1])} alt={playlist.name} className="w-full h-full object-cover" />
                <img src={getImageSrc(playlist.images300[2])} alt={playlist.name} className="w-full h-full object-cover" />
                <img src={getImageSrc(playlist.images300[3])} alt={playlist.name} className="w-full h-full object-cover" />
              </div>
            ) : mainImage ? (
              <img src={mainImage} alt={playlist.name} className="w-full h-full object-cover" />
            ) : null}
          </motion.div>
          
          <h1 className="text-3xl md:text-5xl font-black tracking-tighter text-black dark:text-white leading-tight mb-2 max-w-[90%]">
            {playlist.name}
          </h1>
          <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 font-bold mb-4">{playlist.owner?.name || 'Qobuz'}</p>
          
          <div className="flex flex-wrap justify-center gap-2 mb-6">
            <span className="text-[11px] font-bold tracking-widest text-gray-500 uppercase">
              PLAYLIST • {playlist.tracks_count} PISTAS • {Math.round(playlist.duration / 60)} MINUTOS
            </span>
          </div>
          
          {/* Action Buttons Centered */}
          <div className="flex items-center gap-4 mb-4">
            <button 
              onClick={(e) => { e.stopPropagation(); setDownloadItem({item: playlist, type: 'playlist'}); }}
              className="w-12 h-12 flex items-center justify-center bg-gray-200/80 dark:bg-gray-800/80 hover:bg-gray-300 dark:hover:bg-gray-700 rounded-full text-black dark:text-white transition-colors"
            >
              <Download className="w-5 h-5" />
            </button>
            <button 
              onClick={() => handlePlay(playlist.tracks?.items?.[0])}
              className="w-16 h-16 flex items-center justify-center bg-black dark:bg-white text-white dark:text-black rounded-full shadow-xl hover:scale-105 transition-transform"
            >
              <Play className="w-7 h-7 fill-current ml-1" />
            </button>
            <button className="w-12 h-12 flex items-center justify-center bg-gray-200/80 dark:bg-gray-800/80 hover:bg-gray-300 dark:hover:bg-gray-700 rounded-full text-black dark:text-white transition-colors">
              <Heart className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tracks List */}
        <div className="mt-8">
          <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-1">
            {playlist.tracks?.items?.map((track: any, index: number) => (
              <motion.div variants={itemVariants} key={track.id + "-" + index} onClick={() => handlePlay(track)} className="flex items-center space-x-4 p-3 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 transition-colors group cursor-pointer">
                <div className="w-10 h-10 rounded-md overflow-hidden shrink-0 relative bg-gray-200 dark:bg-gray-800">
                  <img src={getImageSrc(track.album?.image) || getImageSrc(track.image)} alt={track.title} className="w-full h-full object-cover" />
                  {currentTrack?.id === track.id.toString() && isPlaying && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <div className="flex gap-0.5 justify-center h-4 items-end">
                        <div className="w-1 bg-white animate-[bounce_1s_infinite] h-2"></div>
                        <div className="w-1 bg-white animate-[bounce_1s_infinite_0.2s] h-4"></div>
                        <div className="w-1 bg-white animate-[bounce_1s_infinite_0.4s] h-3"></div>
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <p className={`font-bold text-[15px] leading-snug truncate ${currentTrack?.id === track.id.toString() ? 'text-[#007AFF]' : 'text-black dark:text-white'}`}>
                    {track.title}
                  </p>
                  <p className="text-gray-500 dark:text-gray-400 text-[13px] font-medium truncate mt-0.5">
                    {track.performer?.name || track.artist?.name}
                  </p>
                </div>
                
                <div className="flex items-center gap-2 opacity-100 transition-opacity">
                  <button 
                    onClick={(e) => { e.stopPropagation(); setDownloadItem({item: {...track, album: track.album}, type: 'track'}); }}
                    className="p-2 text-gray-400 hover:text-black dark:hover:text-white rounded-full transition-colors"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={(e) => { e.stopPropagation(); setContextMenuTrack({ item: track, type: 'track' }); }}
                    className="p-2 text-gray-400 hover:text-black dark:hover:text-white rounded-full transition-colors"
                  >
                    <MoreHorizontal className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            ))}
          </motion.div>
          {hasMore && (
            <div ref={targetRef} className="py-6 flex justify-center">
              <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
            </div>
          )}
        </div>
      </div>

      
      </>
      )}
    </div>
  );
}
