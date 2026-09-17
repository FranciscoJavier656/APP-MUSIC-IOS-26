const fs = require('fs');

// 1. Update TrackContextMenu.tsx
let code = fs.readFileSync('src/components/TrackContextMenu.tsx', 'utf8');
code = code.replace(
  "track: any | null;",
  "track: any | null;\n  itemType?: 'album' | 'track' | 'playlist';"
);
code = code.replace(
  "export default function TrackContextMenu({ track, onClose, onDownload, onGoToAlbum, onGoToArtist }: TrackContextMenuProps) {",
  "export default function TrackContextMenu({ track, itemType = 'track', onClose, onDownload, onGoToAlbum, onGoToArtist }: TrackContextMenuProps) {"
);
code = code.replace(
  "Descargar pista",
  "{itemType === 'album' ? 'Descargar álbum' : itemType === 'playlist' ? 'Descargar playlist' : 'Descargar pista'}"
);
fs.writeFileSync('src/components/TrackContextMenu.tsx', code);

// 2. Update PlayerContext.tsx
let playerCode = fs.readFileSync('src/components/PlayerContext.tsx', 'utf8');
playerCode = playerCode.replace(
  "contextMenuTrack: any | null;",
  "contextMenuTrack: { item: any, type: 'album'|'track'|'playlist' } | null;"
);
playerCode = playerCode.replace(
  "setContextMenuTrack: (track: any | null) => void;",
  "setContextMenuTrack: (track: { item: any, type: 'album'|'track'|'playlist' } | null) => void;"
);
playerCode = playerCode.replace(
  "const [contextMenuTrack, setContextMenuTrack] = useState<any | null>(null);",
  "const [contextMenuTrack, setContextMenuTrack] = useState<{ item: any, type: 'album'|'track'|'playlist' } | null>(null);"
);
playerCode = playerCode.replace(
  "track={contextMenuTrack}",
  "track={contextMenuTrack?.item}\n          itemType={contextMenuTrack?.type}"
);
playerCode = playerCode.replace(
  "setDownloadItem({item: contextMenuTrack, type: 'track'});",
  "setDownloadItem({item: contextMenuTrack.item, type: contextMenuTrack.type});"
);
fs.writeFileSync('src/components/PlayerContext.tsx', playerCode);

// 3. Update LibraryTab.tsx
let libraryCode = fs.readFileSync('src/components/LibraryTab.tsx', 'utf8');
libraryCode = libraryCode.replace(
  "setContextMenuTrack(item.original);",
  "setContextMenuTrack({ item: item.original, type: item.type as any });"
);
fs.writeFileSync('src/components/LibraryTab.tsx', libraryCode);

// 4. Update AlbumView.tsx
let albumCode = fs.readFileSync('src/components/AlbumView.tsx', 'utf8');
albumCode = albumCode.replace(
  /setContextMenuTrack\(track\);/g,
  "setContextMenuTrack({ item: track, type: 'track' });"
);
fs.writeFileSync('src/components/AlbumView.tsx', albumCode);

// 5. Update PlaylistView.tsx
let playlistCode = fs.readFileSync('src/components/PlaylistView.tsx', 'utf8');
playlistCode = playlistCode.replace(
  /setContextMenuTrack\(track\);/g,
  "setContextMenuTrack({ item: track, type: 'track' });"
);
fs.writeFileSync('src/components/PlaylistView.tsx', playlistCode);

// 6. Update HomeTab.tsx
let homeCode = fs.readFileSync('src/components/HomeTab.tsx', 'utf8');
homeCode = homeCode.replace(
  /setContextMenuTrack\(track\);/g,
  "setContextMenuTrack({ item: track, type: 'track' });"
);
fs.writeFileSync('src/components/HomeTab.tsx', homeCode);
