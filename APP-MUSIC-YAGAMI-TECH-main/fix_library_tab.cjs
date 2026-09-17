const fs = require('fs');
let code = fs.readFileSync('src/components/LibraryTab.tsx', 'utf8');

if(!code.includes("import { OfflineImage }")) {
   code = code.replace("import React, { useState, useEffect, useMemo } from 'react';", "import React, { useState, useEffect, useMemo } from 'react';\nimport { OfflineImage } from './OfflineImage';\nimport { getImageSrc } from '../lib/image';");
}

const oldImg = `<img 
                          src={item.image} 
                          alt="" 
                          className={\`w-20 h-20 bg-white/5 \${item.type === 'artist' ? 'rounded-full' : 'rounded-xl'} object-cover\`}
                        onError={(e) => { e.currentTarget.src = 'https://placehold.co/400x400/1C1C1E/FFFFFF/png?text = Audio' }} />`;

const newImg = `<OfflineImage 
                          localPath={item.localCoverPath || item.original?.localCoverPath} 
                          remoteUrl={getImageSrc(item.image) || getImageSrc(item.original?.album?.image || item.original?.image)} 
                          alt="" 
                          className={\`w-20 h-20 bg-white/5 \${item.type === 'artist' ? 'rounded-full' : 'rounded-xl'} object-cover\`}
                        />`;

if (code.includes(oldImg)) {
    code = code.replace(oldImg, newImg);
    console.log('Replaced old image element.');
} else {
    console.log('Could not find old image element.');
}

const oldDrillDownImg = `<img 
                        src={t.image} 
                        alt="" 
                        className="w-12 h-12 bg-white/5 rounded-md object-cover" 
                      />`;
const newDrillDownImg = `<OfflineImage 
                        localPath={t.localCoverPath || t.original?.localCoverPath} 
                        remoteUrl={getImageSrc(t.image)} 
                        alt="" 
                        className="w-12 h-12 bg-white/5 rounded-md object-cover" 
                      />`;

if (code.includes(oldDrillDownImg)) {
    code = code.replace(oldDrillDownImg, newDrillDownImg);
    console.log('Replaced drilldown image.');
}

fs.writeFileSync('src/components/LibraryTab.tsx', code);
