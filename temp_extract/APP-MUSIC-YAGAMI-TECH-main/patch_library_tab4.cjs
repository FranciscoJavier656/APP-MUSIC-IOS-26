const fs = require('fs');
let code = fs.readFileSync('src/components/LibraryTab.tsx', 'utf8');

// Replace the renderDrillDown function entirely with a usage of OfflineDetailView
const replaceRegex = /const renderDrillDown = \(\) => \{[\s\S]*?\n  \};\n/m;
const newRenderDrillDown = `
  const renderDrillDown = () => {
    const parent = selectedAlbum || selectedArtist;
    if (!parent) return null;

    const tracks = offlineTracks.filter(t => {
      const orig = t.original || t;
      if (selectedAlbum) {
         return (orig.album?.id?.toString() === selectedAlbum.id) || (orig.album?.title === selectedAlbum.title);
      }
      if (selectedArtist) {
         const aId = orig.artist?.id?.toString() || orig.artist?.name || orig.performer?.name;
         return aId === selectedArtist.id || orig.artist?.name === selectedArtist.title;
      }
      return false;
    });

    return <OfflineDetailView 
             item={parent} 
             tracks={tracks} 
             type={selectedAlbum ? 'album' : 'artist'} 
             onBack={() => { setSelectedAlbum(null); setSelectedArtist(null); }} 
           />;
  };
`;

if (code.match(replaceRegex)) {
  code = code.replace(replaceRegex, newRenderDrillDown);
  code = "import OfflineDetailView from './OfflineDetailView';\n" + code;
  fs.writeFileSync('src/components/LibraryTab.tsx', code);
  console.log("Patched LibraryTab.tsx with OfflineDetailView");
} else {
  console.log("Could not find renderDrillDown in LibraryTab.tsx");
}
