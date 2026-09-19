import React, { useState } from 'react';
import { ChevronDown, SlidersHorizontal, MoreHorizontal, ListMusic, Info, Download } from 'lucide-react';
import { usePlayer } from '../PlayerContext';

interface PlayerHeaderProps {
  onClose: () => void;
  onOpenEQ: () => void;
  onOpenQueue: () => void;
}

export default function PlayerHeader({ onClose, onOpenEQ, onOpenQueue }: PlayerHeaderProps) {
  const { currentTrack, setContextMenuTrack, setDownloadItem } = usePlayer();
  const [showMetadata, setShowMetadata] = useState(false);

  if (!currentTrack) return null;

  return (
    <>
      <div className="flex items-center justify-between mb-8 relative z-10">
        <button
          onClick={onClose}
          className="p-2 -ml-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
        >
          <ChevronDown className="w-8 h-8 text-black dark:text-white" />
        </button>
        <span className="text-[11px] font-bold tracking-[0.2em] uppercase text-black/40 dark:text-white/40">
          REPRODUCIENDO DESDE<br/>
          <span className="text-black/80 dark:text-white/80 block mt-0.5 tracking-widest text-center">Qobuz</span>
        </span>
        <div className="flex items-center gap-1 -mr-2">
          <button onClick={onOpenEQ} className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors">
            <SlidersHorizontal className="w-6 h-6 text-black dark:text-white" />
          </button>
          <button onClick={() => setContextMenuTrack({ item: currentTrack, type: 'track' })} className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors">
            <MoreHorizontal className="w-6 h-6 text-black dark:text-white" />
          </button>
          <button onClick={onOpenQueue} className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors">
            <ListMusic className="w-6 h-6 text-black dark:text-white" />
          </button>
        </div>
      </div>

    </>
  );
}
