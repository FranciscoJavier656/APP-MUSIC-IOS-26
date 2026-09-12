import { motion, AnimatePresence } from 'motion/react';
import { Download, Disc, Mic2, X, Music } from 'lucide-react';

interface TrackContextMenuProps {
  track: any | null;
  itemType?: 'album' | 'track' | 'playlist' | 'artist';
  onClose: () => void;
  onDownload: () => void;
  onGoToAlbum?: () => void;
  onGoToArtist?: () => void;
}

export default function TrackContextMenu({ track, itemType = 'track', onClose, onDownload, onGoToAlbum, onGoToArtist }: TrackContextMenuProps) {
  if (!track) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex flex-col justify-end"
      >
        {/* Backdrop */}
        <div 
          className="absolute inset-0 bg-black/40 backdrop-blur-sm"
          onClick={onClose}
        />
        
        {/* Sheet */}
        <motion.div
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ type: "spring", damping: 25, stiffness: 200 }}
          className="relative bg-[#F2F2F7] dark:bg-[#1C1C1E] rounded-t-3xl pb-10 pt-6 px-6 shadow-2xl"
        >
          {/* Header */}
          <div className="flex items-center gap-4 border-b border-black/5 dark:border-white/10 pb-6 mb-4">
            <div className="w-16 h-16 rounded-xl bg-gray-200 dark:bg-gray-800 overflow-hidden shadow-sm shrink-0">
              {(() => {
                const src = track.album?.image?.small || track.album?.image?.large || track.image?.small || track.image?.large || (typeof track.image === 'string' ? track.image : '');
                return src ? <img src={src} alt={track.title} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-gray-400 bg-gray-200 dark:bg-gray-800"><Music /></div>;
              })()}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-black text-xl line-clamp-1 text-black dark:text-white">{track.title}</h3>
              <p className="text-gray-500 font-medium line-clamp-1">{track.artist?.name || track.performer?.name || track.artist}</p>
            </div>
            <button onClick={onClose} className="w-8 h-8 flex items-center justify-center bg-black/5 dark:bg-white/10 rounded-full">
              <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
            </button>
          </div>
          
          {/* Actions */}
          <div className="flex flex-col gap-2">
            <button 
              onClick={() => { onDownload(); onClose(); }}
              className="flex items-center gap-4 p-4 rounded-2xl bg-white dark:bg-black/20 hover:bg-black/5 dark:hover:bg-white/5 active:scale-[0.98] transition-all"
            >
              <div className="w-10 h-10 rounded-full bg-[#007AFF]/10 flex items-center justify-center">
                <Download className="w-5 h-5 text-[#007AFF]" />
              </div>
              <span className="font-bold text-[17px] text-black dark:text-white">{itemType === 'album' ? 'Descargar álbum' : itemType === 'playlist' ? 'Descargar playlist' : 'Descargar pista'}</span>
            </button>
            
            <button 
              onClick={() => { onClose(); if (onGoToAlbum) onGoToAlbum(); }}
              className="flex items-center gap-4 p-4 rounded-2xl bg-white dark:bg-black/20 hover:bg-black/5 dark:hover:bg-white/5 active:scale-[0.98] transition-all"
            >
              <div className="w-10 h-10 rounded-full bg-black/5 dark:bg-white/10 flex items-center justify-center">
                <Disc className="w-5 h-5 text-gray-700 dark:text-gray-300" />
              </div>
              <span className="font-bold text-[17px] text-black dark:text-white">Ir al álbum</span>
            </button>
            
            <button 
              onClick={() => { onClose(); if (onGoToArtist) onGoToArtist(); }}
              className="flex items-center gap-4 p-4 rounded-2xl bg-white dark:bg-black/20 hover:bg-black/5 dark:hover:bg-white/5 active:scale-[0.98] transition-all"
            >
              <div className="w-10 h-10 rounded-full bg-black/5 dark:bg-white/10 flex items-center justify-center">
                <Mic2 className="w-5 h-5 text-gray-700 dark:text-gray-300" />
              </div>
              <span className="font-bold text-[17px] text-black dark:text-white">Ir al artista</span>
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
