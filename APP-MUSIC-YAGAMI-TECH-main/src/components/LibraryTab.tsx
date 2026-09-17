
import OfflineDetailView from './OfflineDetailView';
import React, { useState, useEffect, useMemo } from 'react';
import { OfflineImage } from './OfflineImage';
import { getImageSrc } from '../lib/image';
import { Capacitor } from '@capacitor/core';
import { motion } from 'motion/react';
import { Loader2, Music, Play, Disc, Trash2, Heart, ListMusic, User, Search, Filter, ChevronLeft, DownloadCloud, MoreVertical } from 'lucide-react';
import { usePlayer } from './PlayerContext';
import { getUserFavorites, getUserPlaylists } from '../lib/qobuz';
import { useIntersectionObserver } from '../hooks/useIntersectionObserver';

type LibraryMode = 'streaming' | 'descargados';

export default function LibraryTab() {
  const [libraryMode, setLibraryMode] = useState<LibraryMode>('streaming');
  const [activeTab, setActiveTab] = useState<'albums' | 'artists' | 'tracks' | 'playlists'>('tracks');
  
  const [offlineData, setOfflineData] = useState<any[]>([]);
  const [streamingData, setStreamingData] = useState<any[]>([]);
  
  const [selectedAlbum, setSelectedAlbum] = useState<any>(null);
  const [selectedArtist, setSelectedArtist] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMoreStreaming, setHasMoreStreaming] = useState(true);
  const [offset, setOffset] = useState(0);
  const { targetRef, isIntersecting } = useIntersectionObserver({ threshold: 0.1 });
  
  const { playTrack, setContextMenuTrack } = usePlayer();

  const loadData = async (currentOffset = 0) => {
    setIsLoading(true);
    if (libraryMode === 'streaming') {
      try {
        if (activeTab === 'playlists') {
          const res = await getUserPlaylists(50, currentOffset);
          const items = res?.playlists?.items || [];
          setStreamingData(currentOffset === 0 ? items : prev => [...prev, ...items]);
          setHasMoreStreaming(items.length === 50);
        } else {
          const res = await getUserFavorites(activeTab, 50, currentOffset);
          const items = res?.[activeTab]?.items || [];
          setStreamingData(currentOffset === 0 ? items : prev => [...prev, ...items]);
          setHasMoreStreaming(items.length === 50);
        }
      } catch (e) {
        console.error("Error loading streaming library:", e);
        setStreamingData([]);
      }
    } else {
      try {
        const storageKey = activeTab === 'tracks' ? 'offline_library_tracks' 
                          : activeTab === 'albums' ? 'offline_library_albums'
                          : activeTab === 'artists' ? 'offline_library_artists'
                          : 'offline_library_playlists';
        
        const dataStr = localStorage.getItem(storageKey);
        if (dataStr) {
          const obj = JSON.parse(dataStr);
          const arr = Object.values(obj).sort((a: any, b: any) => (b.downloadedAt || 0) - (a.downloadedAt || 0));
          setOfflineData(arr);
        } else {
          // Fallback backward compatibility for tracks
          if (activeTab === 'tracks') {
            const oldStr = localStorage.getItem('offline_tracks');
            setOfflineData(oldStr ? Object.values(JSON.parse(oldStr)) : []);
          } else {
            setOfflineData([]);
          }
        }
      } catch (e) {
        console.error("Error loading offline library:", e);
        setOfflineData([]);
      }
    }
    setIsLoading(false);
  };

  useEffect(() => {
    setOffset(0);
    setHasMoreStreaming(true);
    loadData(0);

    const handleUpdate = () => {
      if (libraryMode === 'descargados') loadData();
    };
    window.addEventListener('offline-library-updated', handleUpdate);
    return () => window.removeEventListener('offline-library-updated', handleUpdate);
  }, [libraryMode, activeTab]);

  const tabs = [
    { id: 'albums', title: 'Álbumes', icon: Disc },
    { id: 'artists', title: 'Artistas', icon: User },
    { id: 'tracks', title: 'Favoritos', icon: Heart },
    { id: 'playlists', title: 'Playlists', icon: ListMusic }
  ];

  const items = useMemo(() => {
    const rawData = libraryMode === 'streaming' ? streamingData : offlineData;
    
    return rawData.map((item: any) => {
      // Normalize Qobuz API format vs Local Storage format
      const id = item.id || item.qobuz_id;
      let title = item.title || item.name;
      let subtitle = '';
      let type: string = activeTab; // albums, artists, tracks, playlists
      let image = item.image?.small || item.image?.large || item.picture?.small || item.album?.image?.small;
      
      if (activeTab === 'tracks') {
        subtitle = item.artist?.name || item.performer?.name || item.album?.title;
        type = 'track';
      } else if (activeTab === 'albums') {
        subtitle = item.artist?.name;
        type = 'album';
      } else if (activeTab === 'artists') {
        subtitle = item.albums_count ? `${item.albums_count} álbumes` : '';
        type = 'artist';
      } else if (activeTab === 'playlists') {
        subtitle = item.owner?.name;
        type = 'playlist';
      }
      
      return {
        id,
        title,
        subtitle,
        image,
        type,
        original: item,
        trackCount: item.tracks_count,
        localCoverPath: item.localCoverPath,
        localPath: item.localPath
      };
    });
  }, [streamingData, offlineData, libraryMode, activeTab]);

  
  useEffect(() => {
    if (libraryMode === 'streaming' && isIntersecting && hasMoreStreaming && !isLoading && !loadingMore && !(selectedAlbum || selectedArtist)) {
      setLoadingMore(true);
      const nextOffset = offset + 50;
      setOffset(nextOffset);
      
      const fetchMore = async () => {
        try {
          if (activeTab === 'playlists') {
            const res = await getUserPlaylists(50, nextOffset);
            const items = res?.playlists?.items || [];
            setStreamingData(prev => [...prev, ...items]);
            setHasMoreStreaming(items.length === 50);
          } else {
            const res = await getUserFavorites(activeTab, 50, nextOffset);
            const items = res?.[activeTab]?.items || [];
            setStreamingData(prev => [...prev, ...items]);
            setHasMoreStreaming(items.length === 50);
          }
        } catch (e) {
          console.error(e);
        } finally {
          setLoadingMore(false);
        }
      };
      
      fetchMore();
    }
  }, [isIntersecting, hasMoreStreaming, isLoading, loadingMore, libraryMode, activeTab, offset, selectedAlbum, selectedArtist]);

  const handleFilterToggle = () => {
    setLibraryMode(prev => prev === 'streaming' ? 'descargados' : 'streaming');
  };

  const removeTrack = (trackId: string) => {
    if (window.confirm("¿Estás seguro de eliminar este elemento?")) {
      try {
        const tracksStr = localStorage.getItem('offline_library_tracks') || localStorage.getItem('offline_tracks');
        if (tracksStr) {
          const tracksObj = JSON.parse(tracksStr);
          delete tracksObj[trackId];
          localStorage.setItem('offline_library_tracks', JSON.stringify(tracksObj));
          localStorage.setItem('offline_tracks', JSON.stringify(tracksObj)); // keep backward compat
          loadData();
        }
      } catch (e) {}
    }
  };

  const renderDrillDown = () => {
    const parent = selectedAlbum || selectedArtist;
    const tracks = offlineData.filter((orig: any) => {
      if (selectedAlbum) {
        const aId = orig.album?.id?.toString() || orig.album?.title;
        return aId === selectedAlbum.id || orig.album?.title === selectedAlbum.title;
      }
      if (selectedArtist) {
        const aId = orig.artist?.id?.toString() || orig.artist?.name || orig.performer?.name;
        return aId === selectedArtist.id || orig.artist?.name === selectedArtist.title;
      }
      return false;
    });

    return <OfflineDetailView
              item={parent}
              tracks={tracks}
              type={selectedAlbum ? 'album' : 'artist'}
              onBack={() => { setSelectedAlbum(null); setSelectedArtist(null); }}
              onRemoveTrack={libraryMode === 'descargados' ? removeTrack : undefined}
            />;
  };

  const renderEmptyState = () => {
    const activeTabInfo = tabs.find(t => t.id === activeTab);
    const IconComponent = activeTabInfo?.icon || Music;
    
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 mt-10">
        <div className="w-24 h-24 mb-6 relative">
          <div className="absolute inset-0 bg-[#007AFF]/10 rounded-full blur-2xl" />
          <div className="relative w-full h-full rounded-full bg-gray-200 dark:bg-gray-800 flex items-center justify-center shadow-sm">
            <IconComponent className="w-10 h-10 text-gray-400" />
          </div>
        </div>
        <h3 className="text-xl font-black tracking-tighter text-black dark:text-white mb-2 text-center">
          No hay {activeTabInfo?.title.toLowerCase()}
        </h3>
        <p className="text-gray-500 text-[15px] font-medium text-center mb-6 max-w-[250px]">
          {libraryMode === 'streaming' 
            ? `No has agregado ${activeTabInfo?.title.toLowerCase()} a tus favoritos de Qobuz.`
            : `No has descargado ${activeTabInfo?.title.toLowerCase()} en este dispositivo.`}
        </p>
      </div>
    );
  };

  return (
    <div className="h-full w-full overflow-y-auto bg-black pb-[180px]">
      <div className="pt-12 px-6 pb-2">
        <div className="flex justify-between items-center">
          <h1 className="text-[34px] font-bold tracking-tight text-white">Biblioteca</h1>
          <button
            onClick={handleFilterToggle}
            className="w-10 h-10 rounded-full flex items-center justify-center transition-colors bg-[#1C1C1E] text-gray-400"
          >
            <Filter size={20} className={libraryMode === 'descargados' ? 'text-[#FFB800]' : 'text-gray-400'} />
          </button>
        </div>
        <p className="text-[14px] text-gray-400 font-medium mt-1 tracking-wide">
          {items.length} {items.length === 1 ? 'elemento' : 'elementos'}
          <span className={libraryMode === 'descargados' ? 'text-[#FFB800]' : 'text-[#007AFF]'}>
            {' '}• {libraryMode === 'descargados' ? 'Descargados' : 'Streaming'}
          </span>
        </p>
      </div>

      <div className="px-6 mb-4">
        <div className="flex gap-2 overflow-x-auto no-scrollbar py-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => { setActiveTab(tab.id as any); setSelectedAlbum(null); setSelectedArtist(null); }}
                className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-[14px] font-semibold transition-all border ${
                  isActive 
                    ? 'bg-white text-black border-white' 
                    : 'bg-transparent text-gray-300 border-gray-600 hover:border-gray-400'
                }`}
              >
                <Icon size={16} />
                <span>{tab.title}</span>
              </button>
            );
          })}
        </div>
      </div>

      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex-1 flex flex-col"
      >
        {(selectedAlbum || selectedArtist) ? renderDrillDown() : items.length === 0 && !isLoading ? (
          renderEmptyState()
        ) : (
          <div className="px-4 space-y-1">
            {items.map((item, idx) => (
              <div key={item.id || idx} className="flex items-center space-x-3 p-2 rounded-xl hover:bg-white/5 transition-colors cursor-pointer group">
                <div 
                  className={`w-[52px] h-[52px] bg-gray-800 ${item.type === 'artist' ? 'rounded-full' : 'rounded-md'} overflow-hidden flex-shrink-0 relative`}
                  onClick={() => {
    if (libraryMode === 'streaming') {
      if (item.type === 'album') document.dispatchEvent(new CustomEvent('open-overlay', { detail: { type: 'album', id: item.id } }));
      if (item.type === 'artist') document.dispatchEvent(new CustomEvent('open-overlay', { detail: { type: 'artist', id: item.id } }));
      if (item.type === 'playlist') document.dispatchEvent(new CustomEvent('open-overlay', { detail: { type: 'playlist', id: item.id } }));
    } else {
      if (item.type === 'album') setSelectedAlbum(item);
      if (item.type === 'artist') setSelectedArtist(item);
    }
  }}
                >
                  <OfflineImage 
                    localPath={item.localCoverPath || item.original?.localCoverPath} 
                    remoteUrl={getImageSrc(item.image) || getImageSrc(item.original?.album?.image || item.original?.image)} 
                    alt={item.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute bottom-1 right-1 bg-black/60 backdrop-blur-md rounded-full p-1 border border-white/10 hidden group-hover:block">
                    {item.type === 'artist' ? <User size={8} className="text-white" /> : 
                     item.type === 'album' ? <Disc size={8} className="text-white" /> : 
                     <Music size={8} className="text-white" />}
                  </div>
                </div>

                <div 
                  className="flex-1 min-w-0" 
                  onClick={() => {
    if (libraryMode === 'streaming') {
      if (item.type === 'album') document.dispatchEvent(new CustomEvent('open-overlay', { detail: { type: 'album', id: item.id } }));
      if (item.type === 'artist') document.dispatchEvent(new CustomEvent('open-overlay', { detail: { type: 'artist', id: item.id } }));
      if (item.type === 'playlist') document.dispatchEvent(new CustomEvent('open-overlay', { detail: { type: 'playlist', id: item.id } }));
    } else {
      if (item.type === 'album') setSelectedAlbum(item);
      if (item.type === 'artist') setSelectedArtist(item);
    }
  }}
                >
                  <p className="font-semibold text-[16px] leading-tight truncate text-white">{item.title}</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    {item.trackCount && <span className="text-gray-400 text-[13px]">{item.trackCount} pistas • </span>}
                    {item.subtitle && <p className="text-gray-400 text-[13px] truncate font-medium">{item.subtitle}</p>}
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  {(item.type === 'track') && (
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        const trackToPlay = {
                          ...item.original,
                          localPath: item.original.localPath || item.localPath
                        };
                        // Queue is just the visible tracks
                        const queueToPlay = items.filter((i: any) => i.type === 'track').map((i: any) => ({
                          ...(i.original || i),
                          localPath: (i.original && i.original.localPath) || i.localPath
                        }));
                        playTrack(trackToPlay, queueToPlay);
                      }}
                      className="w-9 h-9 flex items-center justify-center bg-[#007AFF]/10 text-[#007AFF] rounded-full transition-colors"
                    >
                      <Play className="w-4 h-4 fill-current ml-0.5" />
                    </button>
                  )}
                  
                  {libraryMode === 'descargados' && (
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        if (item.type === 'track') {
                           removeTrack(item.id);
                        }
                      }}
                      className="w-9 h-9 flex items-center justify-center text-gray-500 hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  )}

                  {libraryMode === 'streaming' && (
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        // open context menu for downloading
                        setContextMenuTrack({ item: item.original, type: item.type as any });
                      }}
                      className="w-9 h-9 flex items-center justify-center text-gray-500 hover:text-white transition-colors"
                    >
                      <MoreVertical className="w-5 h-5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
            {libraryMode === 'streaming' && hasMoreStreaming && (
              <div ref={targetRef} className="py-6 flex justify-center">
                <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
              </div>
            )}
          </div>
        )}
      </motion.div>
    </div>
  );
}
