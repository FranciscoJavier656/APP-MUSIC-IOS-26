import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Capacitor } from '@capacitor/core';

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

    const handleProgress = (e: any) => {
      setActiveDownloads(prev => {
        if (!prev[e.detail.trackId]) return prev;
        return {
          ...prev,
          [e.detail.trackId]: { ...prev[e.detail.trackId], status: 'downloading', progress: e.detail.progress, bytes: e.detail.bytes, total: e.detail.total }
        };
      });
    };

    const handleState = (e: any) => {
      setActiveDownloads(prev => {
        if (!prev[e.detail.trackId]) return prev;
        return {
          ...prev,
          [e.detail.trackId]: { ...prev[e.detail.trackId], status: e.detail.status, progress: e.detail.status === 'downloading' ? 0 : 1 }
        };
      });

      if (e.detail.status === 'completed') {
        setTimeout(() => {
          setActiveDownloads(prev => {
            const next = { ...prev };
            delete next[e.detail.trackId];
            return next;
          });
          window.dispatchEvent(new CustomEvent('offline-library-updated'));
        }, 3000);
      }
    };

    const handleError = (e: any) => {
      setActiveDownloads(prev => {
        if (!prev[e.detail.trackId]) return prev;
        return {
          ...prev,
          [e.detail.trackId]: { ...prev[e.detail.trackId], status: 'error', error: e.detail.error }
        };
      });
    };

    window.addEventListener('download_progress', handleProgress);
    window.addEventListener('download_state', handleState);
    window.addEventListener('download_error', handleError);

    return () => {
      window.removeEventListener('download_progress', handleProgress);
      window.removeEventListener('download_state', handleState);
      window.removeEventListener('download_error', handleError);
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
