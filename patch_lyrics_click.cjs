const fs = require('fs');
let code = fs.readFileSync('src/components/ExpandedPlayer.tsx', 'utf8');

const target = `<div className="absolute inset-0 flex flex-col p-6 bg-black/40">
                <div className="flex justify-center mb-2 relative z-20">
                  <span className="px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-xs font-bold text-white/90 tracking-widest uppercase shadow-sm">
                    Letras
                  </span>
                </div>
                <div onTouchMove={(e) => e.stopPropagation()} className="overflow-y-auto flex-1 text-center" style={{ scrollbarWidth: 'none', maskImage: 'linear-gradient(to bottom, transparent 0%, black 10%, black 90%, transparent 100%)', WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 10%, black 90%, transparent 100%)' }}>`;

const replacement = `<div className="absolute inset-0 flex flex-col p-6 bg-black/40">
                <div className="flex justify-center mb-2 relative z-20">
                  <span 
                    onClick={(e) => { e.stopPropagation(); setShowLyrics(false); }}
                    className="px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-xs font-bold text-white/90 tracking-widest uppercase shadow-sm cursor-pointer hover:bg-white/20 active:bg-white/30 transition-colors"
                  >
                    Volver a Portada
                  </span>
                </div>
                <div onClick={(e) => e.stopPropagation()} onTouchMove={(e) => e.stopPropagation()} className="overflow-y-auto flex-1 text-center" style={{ scrollbarWidth: 'none', maskImage: 'linear-gradient(to bottom, transparent 0%, black 10%, black 90%, transparent 100%)', WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 10%, black 90%, transparent 100%)' }}>`;

if (code.includes(target)) {
    code = code.replace(target, replacement);
    fs.writeFileSync('src/components/ExpandedPlayer.tsx', code);
    console.log("Lyrics click bug fixed.");
} else {
    console.log("Could not find target block.");
}
