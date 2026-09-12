const fs = require('fs');
let code = fs.readFileSync('src/components/ExpandedPlayer.tsx', 'utf8');

const targetContent = `        {/* Progress */}
        <div className="mb-8 relative group">
          <input
            type="range"
            min="0"
            max="100"
            defaultValue="0"
            ref={seekInputRef}
            onChange={handleSeekChange}
            onMouseUp={handleSeekCommit}
            onTouchEnd={handleSeekCommit}
            onTouchStart={(e) => e.stopPropagation()}
            onTouchMove={(e) => e.stopPropagation()}
            className="absolute top-1/2 -translate-y-1/2 w-full h-8 z-10 opacity-0 cursor-pointer touch-none"
          />
          <div className="h-1.5 bg-black/10 dark:bg-white/10 rounded-full overflow-hidden pointer-events-none">
            <div
              ref={progressRef}
              className="h-full relative transition-all duration-100"
              style={{ width: '0%', backgroundColor: dominantColor || 'rgba(120, 120, 120, 0.8)' }}
            >
            </div>
          </div>
          <div className="flex justify-between mt-3 text-[12px] font-semibold text-black/50 dark:text-white/50 tabular-nums tracking-wide">
            <span ref={currentTimeRef}>0:00</span>
            <span ref={remainingTimeRef}>-0:00</span>
          </div>
        </div>`;

const newContent = `        {/* Progress */}
        <div className="mb-8 relative group cursor-pointer">
          <input
            type="range"
            min="0"
            max="100"
            step="0.1"
            defaultValue="0"
            ref={seekInputRef}
            onChange={handleSeekChange}
            onMouseUp={handleSeekCommit}
            onTouchEnd={handleSeekCommit}
            onMouseDown={(e) => { e.stopPropagation(); setIsScrubbing(true); }}
            onTouchStart={(e) => { e.stopPropagation(); setIsScrubbing(true); }}
            onTouchMove={(e) => { e.stopPropagation(); setIsScrubbing(true); }}
            className="absolute top-1/2 -translate-y-1/2 w-full h-10 z-20 opacity-0 cursor-pointer"
            style={{ touchAction: 'none' }}
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

if(code.includes(targetContent)) {
    code = code.replace(targetContent, newContent);
    fs.writeFileSync('src/components/ExpandedPlayer.tsx', code);
    console.log("Progress bar updated successfully");
} else {
    console.log("Target content not found!");
}
