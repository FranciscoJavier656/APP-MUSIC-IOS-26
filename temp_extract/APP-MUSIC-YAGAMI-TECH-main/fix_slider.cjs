const fs = require('fs');
let code = fs.readFileSync('src/components/ExpandedPlayer.tsx', 'utf8');

// 1. Update handleSeekChange
const oldHandleSeekChange = `  const handleSeekChange = (e: any) => {
    setIsScrubbing(true);
    const val = parseFloat(e.target.value);
    const dur = (audioRef.current as any)?.nativeDuration ?? duration;
    const current = (val / 100) * dur;
    
    if (progressRef.current) progressRef.current.style.width = \`\${val}%\`;
    if (currentTimeRef.current) currentTimeRef.current.textContent = formatTime(current);
  };`;

const newHandleSeekChange = `  const handleSeekChange = (e: any) => {
    const val = parseFloat(e.target.value);
    const dur = (audioRef.current as any)?.nativeDuration ?? (audioRef.current?.duration || duration);
    const current = (val / 100) * dur;
    
    if (progressRef.current) progressRef.current.style.width = \`\${val}%\`;
    if (currentTimeRef.current) currentTimeRef.current.textContent = formatTime(current);
  };`;

code = code.replace(oldHandleSeekChange, newHandleSeekChange);

// 2. Update the input element
const oldInput = `          <input
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
          />`;

const newInput = `          <input
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
          />`;

code = code.replace(oldInput, newInput);

fs.writeFileSync('src/components/ExpandedPlayer.tsx', code);
console.log("Slider fixed");
