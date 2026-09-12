const fs = require('fs');

function replaceImages(filePath) {
  let code = fs.readFileSync(filePath, 'utf8');
  
  // HomeTab.tsx
  if (filePath.includes('HomeTab.tsx')) {
    code = code.replace(/src=\{item\.images300\[0\]\}/g, 'src={getImageSrc(item.images300[0])}');
    code = code.replace(/src=\{item\.images300\[1\]\}/g, 'src={getImageSrc(item.images300[1])}');
    code = code.replace(/src=\{item\.images300\[2\]\}/g, 'src={getImageSrc(item.images300[2])}');
    code = code.replace(/src=\{item\.images300\[3\]\}/g, 'src={getImageSrc(item.images300[3])}');
  }
  
  // PlaylistView.tsx
  if (filePath.includes('PlaylistView.tsx')) {
    code = code.replace(/src=\{playlist\.images300\[0\]\}/g, 'src={getImageSrc(playlist.images300[0])}');
    code = code.replace(/src=\{playlist\.images300\[1\]\}/g, 'src={getImageSrc(playlist.images300[1])}');
    code = code.replace(/src=\{playlist\.images300\[2\]\}/g, 'src={getImageSrc(playlist.images300[2])}');
    code = code.replace(/src=\{playlist\.images300\[3\]\}/g, 'src={getImageSrc(playlist.images300[3])}');
    
    // We also need to fix `mainImage` declaration or its usage.
    // It's easier to fix its declaration.
    code = code.replace(/const mainImage = (.+);/, 'const mainImage = getImageSrc($1);');
    
    // Check if getImageSrc is imported
    if (!code.includes('import { getImageSrc }')) {
       code = `import { getImageSrc } from '../lib/image';\n` + code;
    }
  }

  // ParaTiSection.tsx
  if (filePath.includes('ParaTiSection.tsx')) {
    // <img src={genre.img}
    code = code.replace(/src=\{genre\.img\}/g, 'src={getImageSrc(genre.img)}');
  }

  fs.writeFileSync(filePath, code);
}

replaceImages('src/components/HomeTab.tsx');
replaceImages('src/components/PlaylistView.tsx');
replaceImages('src/components/ParaTiSection.tsx');

