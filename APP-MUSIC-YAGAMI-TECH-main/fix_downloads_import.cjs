const fs = require('fs');
let code = fs.readFileSync('src/components/DownloadsTab.tsx', 'utf8');

if (!code.includes("import { OfflineImage }")) {
   code = code.replace("import React, { useState, useEffect, useMemo } from 'react';", "import React, { useState, useEffect, useMemo } from 'react';\nimport { OfflineImage } from './OfflineImage';\nimport { getImageSrc } from '../lib/image';");
}
fs.writeFileSync('src/components/DownloadsTab.tsx', code);
