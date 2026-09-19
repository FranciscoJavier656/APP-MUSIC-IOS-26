import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Capacitor } from '@capacitor/core';
import bus from './eventBus';

export interface ActiveDownload {
  trackId: string;
  progress: number;
  bytes?: number;
  total?: number;
  status: 'queued' | 'downloading' | 'processing_metadata' | 'importing_library' | 'organizing' | 'completed' | 'error';
  trackMetadata: any;
  error?: string;
}

interface DownloadContextType {
  activeDownloads: { [trackId: string]: ActiveDownload };
  addDownload: (trackId: string, trackMetadata: any) => void;
  removeDownload: (trackId: string) => void;
}

const DownloadContext = createContext<DownloadContextType | undefined>(undefined);

export function DownloadProvider({ children }: { children: ReactNode }) {
  const [activeDownloads, setActiveDownloads] = useState<{ [trackId: string]: ActiveDownload }>({});

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    const handleProgress = (detail: any) => {
      setActiveDownloads(prev => {
        if (!prev[detail.trackId]) return prev;
        return {
          ...prev,
          [detail.trackId]: { ...prev[detail.trackId], status: 'downloading', progress: detail.progress, bytes: detail.bytes, total: detail.total }
        };
      });
    };

    const handleState = (detail: any) => {
      setActiveDownloads(prev => {
        if (!prev[detail.trackId]) return prev;
        return {
          ...prev,
          [detail.trackId]: { ...prev[detail.trackId], status: detail.status, progress: detail.status === 'downloading' ? 0 : 1 }
        };
      });

      if (detail.status === 'completed') {
        setTimeout(() => {
          setActiveDownloads(prev => {
            const next = { ...prev };
            delete next[detail.trackId];
            return next;
          });
          bus.emit('offline-library-updated');
        }, 3000);
      }
    };

    const handleError = (detail: any) => {
      setActiveDownloads(prev => {
        if (!prev[detail.trackId]) return prev;
        return {
          ...prev,
          [detail.trackId]: { ...prev[detail.trackId], status: 'error', error: detail.error }
        };
      });
    };

    bus.on('download_progress', handleProgress);
    bus.on('download_state', handleState);
    bus.on('download_error', handleError);

    return () => {
      bus.off('download_progress', handleProgress);
      bus.off('download_state', handleState);
      bus.off('download_error', handleError);
    };
  }, []);

  const addDownload = (trackId: string, trackMetadata: any) => {
    setActiveDownloads(prev => ({
      ...prev,
      [trackId]: {
        trackId,
        progress: 0,
        status: 'queued',
        trackMetadata
      }
    }));
  };

  const removeDownload = (trackId: string) => {
    setActiveDownloads(prev => {
      const next = { ...prev };
      delete next[trackId];
      return next;
    });
  };

  return (
    <DownloadContext.Provider value={{ activeDownloads, addDownload, removeDownload }}>
      {children}
    </DownloadContext.Provider>
  );
}

export const useDownloads = () => {
  const context = useContext(DownloadContext);
  if (context === undefined) {
    throw new Error('useDownloads must be used within a DownloadProvider');
  }
  return context;
};
