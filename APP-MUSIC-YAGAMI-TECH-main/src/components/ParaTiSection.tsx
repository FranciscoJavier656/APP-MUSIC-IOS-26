import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Play } from 'lucide-react';
import { getImageSrc } from '../lib/image';


interface ParaTiSectionProps {
  editorPicks: any[];
  playlists: any[];
  onItemClick: (id: string, type: string) => void;
}

const GENRES = [
  { id: 'rock', name: 'Rock', img: 'https://images.unsplash.com/photo-1498038432885-c6f3f1b912ee?w = 400&q = 80' },
  { id: 'jazz', name: 'Jazz', img: 'https://images.unsplash.com/photo-1511192336575-5a79af67a629?w = 400&q = 80' },
  { id: 'electronic', name: 'Electrónica', img: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w = 400&q = 80' },
  { id: 'classical', name: 'Clásica', img: 'https://images.unsplash.com/photo-1507838153414-b4b713384a76?w = 400&q = 80' },
  { id: 'pop', name: 'Pop', img: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w = 400&q = 80' },
  { id: 'hiphop', name: 'Hip-Hop', img: 'https://images.unsplash.com/photo-1601643157091-ce5c665179ab?w = 400&q = 80' }
];

export default function ParaTiSection({ editorPicks, playlists, onItemClick }: ParaTiSectionProps) {
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);

  const toggleGenre = (id: string) => {
    setSelectedGenres(prev => 
      prev.includes(id) ? prev.filter(g => g !== id) : [...prev, id]
    );
  };

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Buenos días";
    if (hour < 19) return "Buenas tardes";
    return "Tu banda sonora para esta noche";
  };

  if (!hasCompletedOnboarding) {
    return (
      <div className="flex flex-col items-center px-5 pt-8 pb-12 min-h-[70vh]">
        <h2 className="text-3xl font-black tracking-tighter text-center mb-2">¿Qué resuena contigo hoy?</h2>
        <p className="text-gray-500 text-center mb-10">Elige 3 o más géneros para personalizar tu experiencia.</p>
        
        <div className="grid grid-cols-2 md:grid-cols-3 gap-6 w-full max-w-2xl">
          {GENRES.map(genre => {
            const isSelected = selectedGenres.includes(genre.id);
            return (
              <motion.div 
                key={genre.id}
                whileTap={{ scale: 0.9 }}
                onClick={() => toggleGenre(genre.id)}
                className={`relative aspect-square rounded-full overflow-hidden cursor-pointer flex items-center justify-center border-4 transition-all duration-300 ${isSelected ? 'border-[#007AFF] scale-105' : 'border-transparent'}`}
              >
                <img src={getImageSrc(genre.img)} alt={genre.name} className="absolute inset-0 w-full h-full object-cover opacity-60" />
                <div className="absolute inset-0 bg-black/30" />
                <span className="relative text-white font-bold text-lg text-center shadow-sm">{genre.name}</span>
                
                {isSelected && (
                  <div className="absolute inset-0 bg-[#007AFF]/20 mix-blend-overlay" />
                )}
              </motion.div>
            )
          })}
        </div>

        <AnimatePresence>
          {selectedGenres.length >= 3 && (
            <motion.button 
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 50, opacity: 0 }}
              onClick={() => setHasCompletedOnboarding(true)}
              className="mt-12 bg-[#007AFF] text-white px-10 py-4 rounded-full font-bold text-lg hover:scale-105 transition-transform shadow-xl"
            >
              Comenzar a explorar
            </motion.button>
          )}
        </AnimatePresence>
      </div>
    );
  }

  // Dashboard state
  return (
    <div className="flex flex-col gap-10 pt-4">
      <div className="px-5">
        <h2 className="text-3xl font-black tracking-tighter text-black dark:text-white leading-tight mb-6">
          {greeting()}
        </h2>
        
        {/* Quick Mixes (Mocked using playlists) */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {playlists.slice(0, 6).map((playlist) => (
            <div 
              key={playlist.id} 
              onClick={() => onItemClick(playlist.id.toString(), 'playlist')}
              className="flex items-center gap-3 bg-white/60 dark:bg-white/5 hover:bg-white dark:hover:bg-white/10 rounded-xl overflow-hidden cursor-pointer shadow-sm border border-black/5 dark:border-white/5 transition-colors group"
            >
              <div className="w-14 h-14 shrink-0 bg-gray-200 dark:bg-gray-800">
                <img src={getImageSrc(playlist.images300?.[0]) || getImageSrc(playlist.image) || ""} alt={playlist.name} className="w-full h-full object-cover" />
              </div>
              <p className="font-bold text-[13px] leading-tight line-clamp-2 pr-2 group-hover:text-[#007AFF] transition-colors">{playlist.name}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="px-5">
        <h2 className="text-2xl font-black tracking-tighter text-black dark:text-white leading-tight mb-1">
          Porque escuchas {GENRES.find(g => g.id === selectedGenres[0])?.name || 'Música'}
        </h2>
        <p className="text-[15px] font-medium text-gray-500 mb-4">Recomendaciones personalizadas para ti.</p>
        
        <div className="flex overflow-x-auto pb-4 gap-5 no-scrollbar -mx-5 px-5">
          {editorPicks.slice(4, 12).map((item) => (
            <div 
              key={item.id} 
              className="flex-none w-[160px] cursor-pointer group"
              onClick={() => onItemClick(item.id.toString(), 'album')}
            >
              <div className="relative aspect-square mb-3 rounded-lg overflow-hidden shadow-md">
                <img src={getImageSrc(item.image)} alt={item.title} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Play className="w-10 h-10 fill-white text-white drop-shadow-lg" />
                </div>
              </div>
              <h3 className="font-bold text-[14px] line-clamp-1">{item.title}</h3>
              <p className="text-[13px] text-gray-500 line-clamp-1">{item.artist?.name}</p>
            </div>
          ))}
        </div>
      </div>
      
      <div className="px-5">
        <h2 className="text-2xl font-black tracking-tighter text-black dark:text-white leading-tight mb-4">
          Joyas ocultas en Hi-Res
        </h2>
        
        <div className="flex overflow-x-auto pb-4 gap-5 no-scrollbar -mx-5 px-5">
          {editorPicks.filter(a => a.hires).slice(0, 5).map((item) => (
            <div 
              key={item.id} 
              className="flex-none w-[160px] cursor-pointer group"
              onClick={() => onItemClick(item.id.toString(), 'album')}
            >
              <div className="relative aspect-square mb-3 rounded-lg overflow-hidden shadow-md">
                <img src={getImageSrc(item.image)} alt={item.title} className="w-full h-full object-cover" />
                <div className="absolute bottom-2 left-2 bg-[#FFB800] text-black text-[9px] font-black px-1.5 py-0.5 rounded uppercase leading-none shadow-md">
                  Hi-Res
                </div>
              </div>
              <h3 className="font-bold text-[14px] line-clamp-1">{item.title}</h3>
              <p className="text-[13px] text-gray-500 line-clamp-1">{item.artist?.name}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
