const fs = require('fs');
let code = fs.readFileSync('src/components/ExpandedPlayer.tsx', 'utf8');

const oldInput = `<input
            type="range"
            min="0"
            max="100"
            step="0.01"
            defaultValue="0"
            ref={seekInputRef}
            onChange={handleSeekChange}
            onMouseDown={(e) => { e.stopPropagation(); setIsScrubbing(true); }}
            onMouseUp={(e) => { e.stopPropagation(); handleSeekCommit(e); }}
            onTouchStart={(e) => { e.stopPropagation(); setIsScrubbing(true); }}
            onTouchMove={(e) => { e.stopPropagation(); setIsScrubbing(true); }}
            onTouchEnd={(e) => { e.stopPropagation(); handleSeekCommit(e); }}
            onTouchCancel={(e) => { e.stopPropagation(); handleSeekCommit(e); }}
            className="absolute top-1/2 -translate-y-1/2 w-full h-10 z-20 opacity-0 cursor-pointer"
            style={{ touchAction: 'none', WebkitTapHighlightColor: 'transparent' }}
          />`;

const newInput = `<input
            type="range"
            min="0"
            max="100"
            step="0.01"
            defaultValue="0"
            ref={seekInputRef}
            onChange={handleSeekChange}
            onMouseDown={() => setIsScrubbing(true)}
            onMouseUp={(e) => handleSeekCommit(e)}
            onTouchStart={() => setIsScrubbing(true)}
            onTouchEnd={(e) => handleSeekCommit(e)}
            onTouchCancel={(e) => handleSeekCommit(e)}
            className="absolute top-1/2 -translate-y-1/2 w-full h-10 z-20 opacity-0 cursor-pointer"
            style={{ WebkitTapHighlightColor: 'transparent' }}
          />`;

if (code.includes(oldInput)) {
  code = code.replace(oldInput, newInput);
  fs.writeFileSync('src/components/ExpandedPlayer.tsx', code);
  console.log("Slider CSS and events fixed");
} else {
  console.log("Input block not found");
}
