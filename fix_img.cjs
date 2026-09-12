const fs = require('fs');

const fixFile = (path) => {
  if (!fs.existsSync(path)) return;
  let code = fs.readFileSync(path, 'utf8');
  
  // replace anything resembling onError={(e) >/> { e.currentTarget.src > ... }}
  code = code.replace(/onError=\{\(e\)\s*(>|=>|=|>|\/|>|>\/)[\s/]*>\s*\{\s*e\.currentTarget\.src\s*(>|=)\s*'([^']+)'\s*\}\}/g, 
    "onError={(e) => { e.currentTarget.src = '$3' }}");

  fs.writeFileSync(path, code);
};

fixFile('src/components/TrackItem.tsx');
fixFile('src/components/AlbumCard.tsx');
fixFile('src/components/MiniPlayer.tsx');
fixFile('src/components/PlayerContext.tsx');
fixFile('src/components/HomeTab.tsx');
fixFile('src/components/LibraryTab.tsx');
fixFile('src/components/Player.tsx');
