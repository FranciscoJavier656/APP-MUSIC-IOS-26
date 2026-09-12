const fs = require('fs');

let code = fs.readFileSync('src/components/PlayerContext.tsx', 'utf8');

code = code.replace(
  "onGoToAlbum={() => {}}", // if it exists, otherwise we just replace the exact tags
  ""
);

const newMenuProps = `
          onClose={() => setContextMenuTrack(null)}
          onGoToAlbum={() => {
            const track = contextMenuTrack?.item;
            const albumId = track?.album?.id || track?.album?.qobuz_id || (contextMenuTrack?.type === 'album' ? (track?.id || track?.qobuz_id) : null);
            if (albumId) {
              setContextMenuTrack(null);
              document.dispatchEvent(new CustomEvent('open-overlay', { detail: { type: 'album', id: albumId } }));
            }
          }}
          onGoToArtist={() => {
            const track = contextMenuTrack?.item;
            const artistId = track?.artist?.id || track?.performer?.id || (contextMenuTrack?.type === 'artist' ? (track?.id || track?.qobuz_id) : null);
            if (artistId) {
              setContextMenuTrack(null);
              document.dispatchEvent(new CustomEvent('open-overlay', { detail: { type: 'artist', id: artistId } }));
            }
          }}
          onDownload={() => {
`;

code = code.replace(
  "onClose={() => setContextMenuTrack(null)}\n          onDownload={() => {",
  newMenuProps
);

fs.writeFileSync('src/components/PlayerContext.tsx', code);
