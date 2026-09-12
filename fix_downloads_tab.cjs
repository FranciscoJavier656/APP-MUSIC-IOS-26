const fs = require('fs');
let code = fs.readFileSync('src/components/DownloadsTab.tsx', 'utf8');
code = code.replace("import React, { useState, useEffect } from 'react';", "import React, { useState, useEffect } from 'react';\nimport { OfflineImage } from './OfflineImage';\nimport { getImageSrc } from '../lib/image';");

const oldImg = `<img src={item.track?.album?.image?.small || item.track?.image?.small || item.track?.image} alt="" className="w-full h-full object-cover" />`;
const newImg = `<OfflineImage localPath={item.track?.localCoverPath} remoteUrl={getImageSrc(item.track?.album?.image || item.track?.image)} alt="" className="w-full h-full object-cover" />`;

code = code.replace(oldImg, newImg);
fs.writeFileSync('src/components/DownloadsTab.tsx', code);
console.log('done');
