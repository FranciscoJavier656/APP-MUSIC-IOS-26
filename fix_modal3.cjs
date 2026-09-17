const fs = require('fs');
const code = `import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Check, Loader2, Music, AlertCircle } from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import { downloadTrackRouted } from '../lib/DownloadManager';
import { useDownloads } from '../lib/DownloadContext';

interface DownloadModalProps {
  item: any;
  type: 'album' | 'track' | 'playlist';
  onClose: () => void;
}

export default function DownloadModal({ item, type, onClose }: DownloadModalProps) {
  const [format, setFormat] = useState('5');
  const [status, setStatus] = useState<'idle' | 'downloading' | 'done' | 'error'>('idle');
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const { addDownload } = useDownloads();

  const getTracks = () => {
    if (type === 'track') return [item];
    if (type === 'album') return item.tracks?.items || [];
    if (type === 'playlist') return item.tracks?.items || [];
    return [];
  };

  useEffect(() => {
    setStatus('idle');
    setProgress({ current: 0, total: getTracks().length });
  }, [item, type]);

  const handleDownload = async () => {
    setStatus('downloading');
    
    try {
      const tracksToDownload = getTracks();
      const ext = format === '5' ? 'mp3' : 'flac';

      for (let i = 0; i < tracksToDownload.length; i++) {
        const track = tracksToDownload[i];
        // Enforce track to have album obj if it's an album download
        const trackWithAlbum = (type === 'album' && !track.album) ? { ...track, album: item } : track;

        try {
          addDownload(track.id.toString(), trackWithAlbum);
          const success = await downloadTrackRouted(trackWithAlbum, format, ext);
          if (!success) {
            console.warn("Skipped or failed download for track:", track.id);
          }
          
          if (!Capacitor.isNativePlatform()) { 
             // Delay slightly between tracks on Web only since native is async queued
             await new Promise(r => setTimeout(r, 1000));
          }
        } catch (e) {
          console.error("Failed to trigger download for track", track.id, e);
        }
        setProgress(p => ({ ...p, current: i + 1 }));
      }
      
      if (Capacitor.isNativePlatform()) { setStatus('done'); setTimeout(() => onClose(), 800); } else { setStatus('done'); }
    } catch (error) {
      console.error(error);
      setStatus('error');
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative bg-[#1C1C1E] rounded-3xl w-full max-w-sm overflow-hidden"
      >
        {/* Header */}
        <div className="p-6 pb-4 border-b border-white/5">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-white">Descargar</h3>
            <button 
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-full bg-white/10 text-white/60 hover:text-white"
            >
              <X size={18} />
            </button>
          </div>
          <p className="text-white/60 text-sm mt-1">
            {type === 'track' ? item?.title : (type === 'album' ? \`Álbum: \${item?.title}\` : \`Playlist: \${item?.title}\`)}
          </p>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          <div className="space-y-3">
            <label className="text-sm font-medium text-white/60 uppercase tracking-wider">Calidad de audio</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setFormat('5')}
                className={\`flex flex-col items-center p-4 rounded-2xl border transition-all \${
                  format === '5' 
                    ? 'bg-blue-500/20 border-blue-500 text-blue-500' 
                    : 'bg-white/5 border-white/10 text-white hover:bg-white/10'
                }\`}
              >
                <span className="font-bold mb-1">MP3</span>
                <span className="text-xs opacity-60">320 kbps</span>
              </button>
              <button
                onClick={() => setFormat('6')}
                className={\`flex flex-col items-center p-4 rounded-2xl border transition-all \${
                  format === '6' 
                    ? 'bg-blue-500/20 border-blue-500 text-blue-500' 
                    : 'bg-white/5 border-white/10 text-white hover:bg-white/10'
                }\`}
              >
                <span className="font-bold mb-1">FLAC</span>
                <span className="text-xs opacity-60">Lossless 16-bit</span>
              </button>
            </div>
          </div>

          {status === 'idle' && (
            <button
              onClick={handleDownload}
              className="w-full py-4 rounded-2xl bg-white text-black font-bold flex items-center justify-center space-x-2 active:scale-95 transition-transform"
            >
              <Music size={20} />
              <span>Descargar {type === 'track' ? 'Track' : (type === 'album' ? 'Álbum' : 'Playlist')}</span>
            </button>
          )}

          {status === 'downloading' && (
            <div className="py-4 flex flex-col items-center justify-center text-white space-y-4">
              <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
              <div className="text-center">
                <p className="font-medium">Encolando descargas...</p>
                <p className="text-sm text-white/60 mt-1">
                  {progress.current} de {progress.total} procesados
                </p>
              </div>
            </div>
          )}

          {status === 'done' && (
            <div className="py-4 flex flex-col items-center justify-center text-green-500 space-y-3">
              <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center">
                <Check size={24} />
              </div>
              <p className="font-medium text-white">¡Completado!</p>
            </div>
          )}

          {status === 'error' && (
            <div className="py-4 flex flex-col items-center justify-center text-red-500 space-y-3">
              <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center">
                <AlertCircle size={24} />
              </div>
              <p className="font-medium text-white">Error al encolar</p>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
`;
fs.writeFileSync('src/components/DownloadModal.tsx', code);
console.log('done');
