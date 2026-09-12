const fs = require('fs');

function fixFile(filePath) {
  let code = fs.readFileSync(filePath, 'utf8');
  
  if (filePath.includes('HomeTab.tsx')) {
    code = code.replace(/src=\{getImageSrc\(item\.image\) \|\| \(item\.image_rectangle && item\.image_rectangle\[0\]\)\}/g, 'src={getImageSrc(item.image) || getImageSrc(item.image_rectangle?.[0]) || ""}');
  }
  
  if (filePath.includes('ParaTiSection.tsx')) {
    code = code.replace(/src=\{playlist\.images300\?\.\[0\] \|\| getImageSrc\(playlist\.image\)\}/g, 'src={getImageSrc(playlist.images300?.[0]) || getImageSrc(playlist.image) || ""}');
  }

  if (filePath.includes('SearchTab.tsx')) {
    code = code.replace(/topHit\.image\?\.large && <img src=\{getImageSrc\(topHit\.image\) \|\| ''\}/g, 'getImageSrc(topHit.image) && <img src={getImageSrc(topHit.image) || ""}');
  }

  fs.writeFileSync(filePath, code);
}

fixFile('src/components/HomeTab.tsx');
fixFile('src/components/ParaTiSection.tsx');
fixFile('src/components/SearchTab.tsx');

