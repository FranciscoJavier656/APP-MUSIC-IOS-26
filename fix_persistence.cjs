const fs = require('fs');
let code = fs.readFileSync('src/components/PlayerContext.tsx', 'utf8');

// Add trackInitializedRef
code = code.replace(
    'const playRequestRef = useRef(0);',
    'const playRequestRef = useRef(0);\n  const trackInitializedRef = useRef(false);'
);

// Update playTrack
code = code.replace(
    'setIsPlaying(false);\n    setDuration(track.duration || 0); // initial guess from metadata',
    'setIsPlaying(false);\n    trackInitializedRef.current = true;\n    setDuration(track.duration || 0); // initial guess from metadata'
);

// Update togglePlay
code = code.replace(
    `  const togglePlay = () => {
    if (!audioRef.current || !currentTrack) return;

    if (isPlaying) {`,
    `  const togglePlay = () => {
    if (!audioRef.current || !currentTrack) return;

    if (!trackInitializedRef.current) {
        playTrack(currentTrack);
        return;
    }

    if (isPlaying) {`
);

fs.writeFileSync('src/components/PlayerContext.tsx', code);
console.log("Persistence fix applied");
