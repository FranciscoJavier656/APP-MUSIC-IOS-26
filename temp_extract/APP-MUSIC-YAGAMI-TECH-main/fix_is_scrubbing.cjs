const fs = require('fs');
let code = fs.readFileSync('src/components/ExpandedPlayer.tsx', 'utf8');

// 1. We remove _setIsScrubbing and just use refs
code = code.replace(
  'const [isScrubbing, _setIsScrubbing] = useState(false);',
  'const containerRef = useRef<HTMLDivElement>(null);'
);

const oldSetIsScrubbing = `  const setIsScrubbing = (val: boolean) => {
    isScrubbingRef.current = val;
    _setIsScrubbing(val);
  };`;

const newSetIsScrubbing = `  const setIsScrubbing = (val: boolean) => {
    isScrubbingRef.current = val;
    if (!containerRef.current) return;
    
    // Direct DOM manipulation to avoid React re-renders breaking native iOS range sliders
    const trackBg = containerRef.current.querySelector('.track-bg');
    const trackFill = containerRef.current.querySelector('.track-fill');
    const thumb = containerRef.current.querySelector('.track-thumb');
    
    if (val) {
        trackBg?.classList.replace('h-1.5', 'h-2.5');
        trackFill?.classList.remove('transition-all', 'duration-100');
        thumb?.classList.remove('scale-0', 'group-hover:scale-100');
        thumb?.classList.add('scale-150');
    } else {
        trackBg?.classList.replace('h-2.5', 'h-1.5');
        trackFill?.classList.add('transition-all', 'duration-100');
        thumb?.classList.remove('scale-150');
        thumb?.classList.add('scale-0', 'group-hover:scale-100');
    }
  };`;

code = code.replace(oldSetIsScrubbing, newSetIsScrubbing);

// 2. Update the Progress JSX
const oldProgressJSX = `        {/* Progress */}
        <div className="mb-8 relative group cursor-pointer">
          <input
            type="range"
            min="0"
            max="100"
            step="0.01"
            defaultValue="0"
            ref={seekInputRef}
            onChange={handleSeekChange}
            onPointerDown={(e) => { e.stopPropagation(); setIsScrubbing(true); }}
            onPointerUp={(e) => { e.stopPropagation(); handleSeekCommit(e); }}
            onPointerCancel={(e) => { e.stopPropagation(); handleSeekCommit(e); }}
            className="absolute top-1/2 -translate-y-1/2 w-full h-10 z-20 opacity-0 cursor-pointer"
            style={{ touchAction: 'none', WebkitTapHighlightColor: 'transparent' }}
          />
          <div className={\`relative flex items-center bg-black/10 dark:bg-white/10 rounded-full pointer-events-none transition-all duration-300 ease-out \${isScrubbing ? 'h-2.5' : 'h-1.5'}\`}>
            <div
              ref={progressRef}
              className={\`absolute top-0 left-0 h-full rounded-full pointer-events-none \${isScrubbing ? '' : 'transition-all duration-100'}\`}
              style={{ width: '0%', backgroundColor: dominantColor || 'rgba(120, 120, 120, 0.8)' }}
            >
              <div 
                className={\`absolute top-1/2 -translate-y-1/2 -right-1.5 w-3 h-3 bg-white rounded-full shadow-[0_2px_4px_rgba(0,0,0,0.3)] transition-transform duration-300 ease-out \${isScrubbing ? 'scale-150' : 'scale-0 group-hover:scale-100'}\`}
              />
            </div>
          </div>
          <div className="flex justify-between mt-3 text-[12px] font-semibold text-black/50 dark:text-white/50 tabular-nums tracking-wide">
            <span ref={currentTimeRef}>0:00</span>
            <span ref={remainingTimeRef}>-0:00</span>
          </div>
        </div>`;

const newProgressJSX = `        {/* Progress */}
        <div ref={containerRef} className="mb-8 relative group cursor-pointer">
          <input
            type="range"
            min="0"
            max="100"
            step="0.01"
            defaultValue="0"
            ref={seekInputRef}
            onChange={handleSeekChange}
            onPointerDown={(e) => { e.stopPropagation(); setIsScrubbing(true); }}
            onPointerUp={(e) => { e.stopPropagation(); handleSeekCommit(e); }}
            onPointerCancel={(e) => { e.stopPropagation(); handleSeekCommit(e); }}
            className="absolute top-1/2 -translate-y-1/2 w-full h-10 z-20 opacity-0 cursor-pointer"
            style={{ touchAction: 'none', WebkitTapHighlightColor: 'transparent' }}
          />
          <div className="track-bg relative flex items-center bg-black/10 dark:bg-white/10 rounded-full pointer-events-none transition-all duration-300 ease-out h-1.5">
            <div
              ref={progressRef}
              className="track-fill absolute top-0 left-0 h-full rounded-full pointer-events-none transition-all duration-100"
              style={{ width: '0%', backgroundColor: dominantColor || 'rgba(120, 120, 120, 0.8)' }}
            >
              <div 
                className="track-thumb absolute top-1/2 -translate-y-1/2 -right-1.5 w-3 h-3 bg-white rounded-full shadow-[0_2px_4px_rgba(0,0,0,0.3)] transition-transform duration-300 ease-out scale-0 group-hover:scale-100"
              />
            </div>
          </div>
          <div className="flex justify-between mt-3 text-[12px] font-semibold text-black/50 dark:text-white/50 tabular-nums tracking-wide">
            <span ref={currentTimeRef}>0:00</span>
            <span ref={remainingTimeRef}>-0:00</span>
          </div>
        </div>`;

code = code.replace(oldProgressJSX, newProgressJSX);

fs.writeFileSync('src/components/ExpandedPlayer.tsx', code);
console.log("Refactoring complete");
