const fs = require('fs');
let code = fs.readFileSync('src/components/ArtistView.tsx', 'utf8');

// Replace hasMoreTracks setting to false
code = code.replace(
  "setHasMoreTracks((data.tracks?.items?.length || 0) < (data.tracks?.total || 100)); // Default fallback for total",
  "setHasMoreTracks(false);"
);

// Remove the Loader
code = code.replace(
  /            \{hasMoreTracks && \(\s*<div ref=\{targetRef\} className="py-6 flex justify-center">\s*<Loader2 className="w-6 h-6 animate-spin text-gray-400" \/>\s*<\/div>\s*\)\}\n/,
  ""
);

fs.writeFileSync('src/components/ArtistView.tsx', code);
