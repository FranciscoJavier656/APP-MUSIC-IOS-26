const fs = require('fs');
let code = fs.readFileSync('src/components/PlayerContext.tsx', 'utf8');

const targetState = `  // Keep refs in sync for event listeners
  useEffect(() => {
    currentTrackRef.current = currentTrack;
    queueRef.current = queue;
    repeatModeRef.current = repeatMode;
    isShuffleRef.current = isShuffle;
  }, [currentTrack, queue, repeatMode, isShuffle]);`;

const replaceState = `  // Keep refs in sync for event listeners
  useEffect(() => {
    currentTrackRef.current = currentTrack;
    queueRef.current = queue;
    repeatModeRef.current = repeatMode;
    isShuffleRef.current = isShuffle;
    
    if (currentTrack) {
       localStorage.setItem('player_currentTrack', JSON.stringify(currentTrack));
    }
    if (queue.length > 0) {
       localStorage.setItem('player_queue', JSON.stringify(queue));
    }
  }, [currentTrack, queue, repeatMode, isShuffle]);

  useEffect(() => {
    try {
      const savedTrack = localStorage.getItem('player_currentTrack');
      const savedQueue = localStorage.getItem('player_queue');
      if (savedTrack) setCurrentTrack(JSON.parse(savedTrack));
      if (savedQueue) setQueue(JSON.parse(savedQueue));
    } catch(e) {
      console.warn("Failed to restore player state", e);
    }
  }, []);`;

code = code.replace(targetState, replaceState);
fs.writeFileSync('src/components/PlayerContext.tsx', code);
