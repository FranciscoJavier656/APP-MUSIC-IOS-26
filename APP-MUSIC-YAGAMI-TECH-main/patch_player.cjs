const fs = require('fs');
let code = fs.readFileSync('src/components/PlayerContext.tsx', 'utf8');

code = code.replace(
  /export interface Track \{\n\s*local_path\?: string;\n\s*streamUrl\?: string;\n\s*id: string;\n\s*title: string;\n\s*artist: string;\n\s*image: string;/g,
  `export interface Track {
  localPath?: string;
  original?: any;
  local_path?: string;
  streamUrl?: string;
  id: string;
  title: string;
  artist: string;
  image: any;`
);

const playTrackTarget = `  const playTrack = async (track: Track, newQueue?: Track[]) => {
    const requestId = ++playRequestRef.current;
    setCurrentTrack(track);`;

const playTrackReplacement = `  const playTrack = async (rawTrack: any, newQueue?: Track[]) => {
    let track = { ...rawTrack } as Track;
    if (!track.image) {
       track.image = rawTrack.album?.image || rawTrack.original?.album?.image || rawTrack.original?.image || "";
    }
    if (!track.artist || typeof track.artist !== 'string') {
       track.artist = rawTrack.artist?.name || rawTrack.performer?.name || rawTrack.original?.artist?.name || rawTrack.subtitle || "Unknown Artist";
    }
    const requestId = ++playRequestRef.current;
    setCurrentTrack(track);`;

code = code.replace(playTrackTarget, playTrackReplacement);

fs.writeFileSync('src/components/PlayerContext.tsx', code);
console.log("Patched PlayerContext.tsx");
