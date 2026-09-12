const fs = require('fs');
const glob = require('glob');

function fixFile(filePath) {
  let code = fs.readFileSync(filePath, 'utf8');
  let changed = false;

  // Add import if needed
  if (!code.includes('getImageSrc') && (code.includes('<img') || code.includes('image: '))) {
    const importStmt = `import { getImageSrc } from '../lib/image';\n`;
    const lines = code.split('\n');
    const lastImportIndex = lines.reduce((acc, line, i) => line.startsWith('import ') ? i : acc, -1);
    if (lastImportIndex >= 0) {
      lines.splice(lastImportIndex + 1, 0, importStmt);
    } else {
      lines.unshift(importStmt);
    }
    code = lines.join('\n');
    changed = true;
  }

  // We can manually fix the common patterns
  
  if (filePath.includes('SearchTab.tsx')) {
    code = code.replace(
      `<img src={topHit.image.large} alt="" className="w-48 h-48 rounded-full" />`,
      `<img src={getImageSrc(topHit.image) || ''} alt="" className="w-48 h-48 rounded-full" />`
    );
    code = code.replace(
      `<img src={topHit.image?.large || topHit.album?.image?.large} alt={topHit.title} className="w-full h-full object-cover" />`,
      `<img src={getImageSrc(topHit.image) || getImageSrc(topHit.album?.image) || ''} alt={topHit.title} className="w-full h-full object-cover" />`
    );
    code = code.replace(
      `<img src={album.image.large} alt={album.title} className="w-full h-full object-cover" />`,
      `<img src={getImageSrc(album.image) || ''} alt={album.title} className="w-full h-full object-cover" />`
    );
    code = code.replace(
      `<img src={artist.picture || artist.image} alt={artist.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />`,
      `<img src={getImageSrc(artist.picture) || getImageSrc(artist.image) || ''} alt={artist.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />`
    );
    code = code.replace(
      `<img src={track.album?.image?.small || track.image?.small} alt={track.title} className="w-full h-full object-cover" />`,
      `<img src={getImageSrc(track.album?.image) || getImageSrc(track.image) || ''} alt={track.title} className="w-full h-full object-cover" />`
    );
  }

  if (filePath.includes('HomeTab.tsx')) {
    code = code.replace(/src={item\.image\?\.large}/g, 'src={getImageSrc(item.image)}');
    code = code.replace(/src={item\.image\?\.small \|\| item\.image\?\.large}/g, 'src={getImageSrc(item.image)}');
    code = code.replace(/src={item\.image\?\.large \|\| item\.image\?\.root \|\| item\.image_rectangle\?\.\[0\]}/g, 'src={getImageSrc(item.image) || (item.image_rectangle && item.image_rectangle[0])}');
  }
  
  if (filePath.includes('ParaTiSection.tsx')) {
    code = code.replace(/src={playlist\.images300\?\.\[0\] \|\| playlist\.image\?\.small}/g, 'src={playlist.images300?.[0] || getImageSrc(playlist.image)}');
    code = code.replace(/src={item\.image\?\.large}/g, 'src={getImageSrc(item.image)}');
  }

  if (filePath.includes('AlbumView.tsx')) {
    code = code.replace(/src={album\.image\?\.large}/g, 'src={getImageSrc(album.image)}');
  }
  
  if (filePath.includes('PlaylistView.tsx')) {
    code = code.replace(/src={track\.album\?\.image\?\.small \|\| track\.album\?\.image\?\.large}/g, 'src={getImageSrc(track.album?.image) || getImageSrc(track.image)}');
  }

  if (filePath.includes('MiniPlayer.tsx')) {
    code = code.replace(/src={currentTrack\.image}/g, 'src={getImageSrc(currentTrack.image)}');
  }
  
  if (filePath.includes('ExpandedPlayer.tsx')) {
    code = code.replace(/src={currentTrack\.image}/g, 'src={getImageSrc(currentTrack.image)}');
    code = code.replace(/src={track\.image}/g, 'src={getImageSrc(track.image)}');
  }

  fs.writeFileSync(filePath, code);
}

const files = [
  'src/components/SearchTab.tsx',
  'src/components/HomeTab.tsx',
  'src/components/ParaTiSection.tsx',
  'src/components/AlbumView.tsx',
  'src/components/PlaylistView.tsx',
  'src/components/MiniPlayer.tsx',
  'src/components/ExpandedPlayer.tsx'
];

files.forEach(fixFile);

