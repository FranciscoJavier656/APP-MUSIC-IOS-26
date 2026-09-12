import React, { useState, useEffect, useMemo } from 'react';
import { OfflineImage } from './OfflineImage';
import { getImageSrc } from '../lib/image';
import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { motion } from 'motion/react';
import { Music, Play, Disc, Trash2, Heart, ListMusic, User, Search, Filter, Download, AlertCircle, Database, CheckCircle, Clock, Pause, RotateCcw, X } from 'lucide-react';
import { usePlayer } from './PlayerContext';


import { useDownloads } from '../lib/DownloadContext';

export default function DownloadsTab() {
  const [offlineTracks, setOfflineTracks] = useState<any[]>([]);
  const [filter, setFilter] = useState<'all' | 'downloading' | 'completed' | 'error'>('all');
  const [isLoading, setIsLoading] = useState(true);
  
  const { playTrack } = usePlayer();
  const { activeDownloads } = useDownloads();
  const activeDownloadList = Object.values(activeDownloads);

  const loadOfflineLibrary = () => {
    try {
      const tracksStr = localStorage.getItem('offline_tracks');
      if (tracksStr) {
        const tracksObj = JSON.parse(tracksStr);
        const tracks = Object.values(tracksObj).sort((a: any, b: any) => {
          return (b.downloadedAt || 0) - (a.downloadedAt || 0);
        });
        setOfflineTracks(tracks);
      } else {
        setOfflineTracks([]);
      }
    } catch (e) {
      console.error("Error loading offline library:", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadOfflineLibrary();
    const handleUpdate = () => loadOfflineLibrary();
    window.addEventListener('offline-library-updated', handleUpdate);
    return () => window.removeEventListener('offline-library-updated', handleUpdate);
  }, []);

  const formatBytes = (bytes: number): string => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const downloads = useMemo(() => {
    const active = activeDownloadList.map((dl: any) => ({
      id: dl.trackId,
      track: dl.trackMetadata,
      progress: dl.progress * 100, // 0 to 100
      status: dl.status,
      error: dl.error
    }));

    const completed = offlineTracks.map(track => ({
      id: track.id.toString(),
      track: track,
      progress: 100,
      status: 'completed'
    }));

    // Filter out completed ones that are still in active downloads (the 3s delay)
    const activeIds = new Set(active.map(a => a.id.toString()));
    const filteredCompleted = completed.filter(c => !activeIds.has(c.id));

    return [...active, ...filteredCompleted];
  }, [activeDownloadList, offlineTracks]);

  const stats = useMemo(() => {
    const active = downloads.filter(d => ['downloading', 'queued', 'processing_metadata', 'importing_library', 'organizing'].includes(d.status));
    const completed = downloads.filter(d => d.status === 'completed');
    const errors = downloads.filter(d => d.status === 'error');
    
    // Calculate total size (mock for now since we don't store file size in offline_tracks yet)
    // Use actual bytes if possible, else just 0
    const totalSize = completed.reduce((acc, item) => acc + (item.track?.sizeBytes || (item.progress as any)?.bytes || 0), 0);

    return {
      totalDownloads: downloads.length,
      activeDownloads: active.length,
      completedDownloads: completed.length,
      totalSize: totalSize,
      errors: errors.length,
    };
  }, [downloads]);

  const filteredDownloads = useMemo(() => {
    if (filter === 'all') return downloads;
    if (filter === 'completed') return downloads.filter(d => d.status === 'completed');
    if (filter === 'error') return downloads.filter(d => d.status === 'error');
    if (filter === 'downloading') return downloads.filter(d => ['downloading', 'queued', 'processing_metadata', 'importing_library', 'organizing'].includes(d.status));
    return downloads;
  }, [downloads, filter]);

    const removeTrack = async (trackId: string) => {
    if (window.confirm("¿Seguro que deseas eliminar esta descarga?")) {
      try {
        const tracksStr = localStorage.getItem('offline_library_tracks');
        if (tracksStr) {
          const tracksObj = JSON.parse(tracksStr);
          if (tracksObj[trackId]) {
              const lp = tracksObj[trackId].original?.localPath || tracksObj[trackId].localPath;
              delete tracksObj[trackId];
              localStorage.setItem('offline_library_tracks', JSON.stringify(tracksObj));
              
              if (lp) {
                  try {
                      await Filesystem.deleteFile({ directory: Directory.Data, path: lp.replace('file://', '') });
                  } catch(e){}
              }
          }
        }
        
        const oldStr = localStorage.getItem('offline_tracks');
        if (oldStr) {
           const oldObj = JSON.parse(oldStr);
           delete oldObj[trackId];
           localStorage.setItem('offline_tracks', JSON.stringify(oldObj));
        }
        
        loadOfflineLibrary();
      } catch (e) {}
    }
  };

  const clearCompleted = () => {
    if (window.confirm("¿Seguro que deseas eliminar TODAS las descargas completadas?")) {
      localStorage.removeItem('offline_tracks');
      setOfflineTracks([]);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'downloading':
      case 'processing_metadata':
      case 'importing_library':
      case 'organizing':
        return Download;
      case 'completed':
        return CheckCircle;
      case 'error':
        return AlertCircle;
      case 'queued':
        return Clock;
      default:
        return Database;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'downloading':
      case 'processing_metadata':
      case 'importing_library':
      case 'organizing':
        return '#1E90FF';
      case 'completed':
        return '#1DB954';
      case 'error':
        return '#FF4444';
      case 'queued':
        return '#9B59B6';
      default:
        return 'rgba(255,255,255,0.4)';
    }
  };

  if (isLoading) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-[#000] pt-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1E90FF]"></div>
      </div>
    );
  }

  
  const renderEmptyState = () => (
    <div className="flex-1 flex flex-col items-center justify-center p-8 mt-10">
      <div className="w-24 h-24 mb-6 relative">
        <div className="absolute inset-0 bg-[#007AFF]/10 rounded-full blur-2xl" />
        <div className="relative w-full h-full rounded-full bg-gray-200 dark:bg-gray-800 flex items-center justify-center shadow-sm">
          <Download className="w-10 h-10 text-gray-400" />
        </div>
      </div>
      <h3 className="text-xl font-black tracking-tighter text-black dark:text-white mb-2 text-center">
        Sin descargas
      </h3>
      <p className="text-gray-500 text-[15px] font-medium text-center mb-6 max-w-[250px]">
        Descarga música para escucharla sin conexión.
      </p>
      <button 
         className="px-6 py-3 bg-[#007AFF] text-white rounded-full font-bold shadow-md hover:scale-105 active:scale-95 transition-transform flex items-center gap-2"
         onClick={() => document.dispatchEvent(new CustomEvent('navigate', {detail: 'search'}))}
      >
        <Search className="w-5 h-5" />
        <span>Explorar música</span>
      </button>
    </div>
  );

  return (
    <div className="h-full w-full overflow-y-auto bg-[#F2F2F7] dark:bg-[#000000] pb-[180px]">
      <div className="pt-12 px-6 pb-2">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-black tracking-tighter text-black dark:text-white">Descargas</h1>
        </div>
        <p className="text-[13px] text-gray-500 font-medium mt-1">
          {stats.totalDownloads} {stats.totalDownloads === 1 ? 'elemento' : 'elementos'}
          {stats.totalSize > 0 && (
             <span className="text-gray-400">
               {' '}• {formatBytes(stats.totalSize)}
             </span>
          )}
        </p>
      </div>

      <div className="px-6 mb-4 mt-2">
        <div className="flex gap-2 overflow-x-auto no-scrollbar py-2">
          {[
            { id: 'all', title: 'Todos' },
            { id: 'downloading', title: 'Descargando' },
            { id: 'completed', title: 'Completadas' },
            { id: 'error', title: 'Errores' }
          ].map((tab) => {
            const isActive = filter === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setFilter(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-[13px] font-bold transition-all ${
                  isActive 
                     ? 'bg-black text-white dark:bg-white dark:text-black shadow-md' 
                     : 'bg-gray-200 text-gray-600 dark:bg-[#1C1C1E] dark:text-gray-400 hover:bg-gray-300 dark:hover:bg-gray-800'
                }`}
              >
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
        {filteredDownloads.length === 0 ? (
          renderEmptyState()
        ) : (
          <div className="px-4 space-y-1">
            {filteredDownloads.map((item, idx) => {
              const StatusIcon = getStatusIcon(item.status);
              const statusColor = getStatusColor(item.status);
              const isProcessing = ['downloading', 'processing_metadata', 'importing_library', 'organizing'].includes(item.status);
              const getProcessingText = (s: string) => {
                 if(s === 'processing_metadata') return 'Escribiendo metadatos...';
                 if(s === 'importing_library') return 'Importando...';
                 if(s === 'organizing') return 'Organizando...';
                 return '';
              };

              return (
                <div key={item.id || idx} className="flex items-center space-x-3 p-2 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer group">
                  <div className="w-14 h-14 bg-gray-200 dark:bg-gray-800 rounded-lg overflow-hidden flex-shrink-0 relative">
                    {item.track?.album?.image?.small || item.track?.image?.small || item.track?.image ? (
                      <OfflineImage 
                        localPath={item.track?.localCoverPath} 
                        remoteUrl={getImageSrc(item.track?.album?.image || item.track?.image)} 
                        alt="" 
                        className="w-full h-full object-cover" 
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        <Music className="w-6 h-6" />
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-[15px] leading-tight truncate text-black dark:text-white">{item.track?.title || 'Unknown'}</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                       <p className="text-gray-500 text-[13px] truncate font-medium">
                         {item.track?.artist?.name || item.track?.performer?.name || 'Unknown Artist'}
                       </p>
                    </div>
                    
                    {(isProcessing || item.status === 'queued') && (
                      <div className="flex items-center gap-2 mt-1">
                        <div className="flex-1 h-1 bg-gray-300 dark:bg-[#1C1C1E] rounded-full overflow-hidden">
                          <div 
                             className={`h-full rounded-full transition-all duration-300 ${item.status === 'queued' ? 'bg-[#9B59B6]' : 'bg-[#007AFF]'}`}
                            style={{ width: `${Math.round(item.progress)}%` }}
                          />
                        </div>
                        <span className="text-[11px] font-semibold text-gray-500 min-w-[35px] text-right">
                          {item.status === 'queued' ? 'Cola' : `${Math.round(item.progress)}%`}
                        </span>
                      </div>
                    )}

                    <div className="flex items-center gap-1.5 mt-0.5">
                      {item.status === 'queued' && (
                        <span className="text-[11px] text-gray-400">Esperando...</span>
                      )}
                      {item.status === 'downloading' && (
                        <span className="text-[11px] text-[#007AFF]">Descargando...</span>
                      )}
                      {item.status === 'completed' && (
                        <span className="text-[11px] text-[#34C759] font-medium uppercase tracking-wider">
                          Completado {item.track?.sizeBytes ? `• ${formatBytes(item.track.sizeBytes)}` : ''}
                        </span>
                      )}
                      {item.status === 'error' && (
                        <span className="text-[11px] text-[#FF3B30] font-medium truncate">
                          {(item as any).error || 'Error'}
                        </span>
                      )}
                      {isProcessing && item.status !== 'downloading' && (
                         <span className="text-[11px] text-[#007AFF]">{getProcessingText(item.status)}</span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    {item.status !== 'completed' && (
                      <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: `${statusColor}20` }}>
                         <StatusIcon size={16} color={statusColor} />
                      </div>
                    )}

                    {item.status === 'completed' && (
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          const trackToPlay = {
                             ...item.track,
                             localPath: item.track.localPath
                           };
                          const queueToPlay = downloads.filter((d: any) => d.status === 'completed' && d.track).map((d: any) => ({
                            ...d.track,
                            localPath: d.track.localPath
                          }));
                          playTrack(trackToPlay, queueToPlay);
                        }}
                        className="w-10 h-10 flex items-center justify-center bg-[#007AFF]/10 text-[#007AFF] hover:bg-[#007AFF] hover:text-white rounded-full transition-colors"
                      >
                        <Play className="w-5 h-5 fill-current ml-0.5" />
                      </button>
                    )}
                    
                    <button 
                      onClick={(e) => {
                         e.stopPropagation();
                         if (item.status === 'completed') removeTrack(item.id);
                      }}
                      className={`w-10 h-10 flex items-center justify-center text-gray-400 hover:text-[#FF3B30] hover:bg-[#FF3B30]/10 rounded-full transition-colors ${item.status === 'completed' ? '' : 'opacity-0 pointer-events-none'}`}
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </motion.div>
    </div>
  );
}
