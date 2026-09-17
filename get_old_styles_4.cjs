const fs = require('fs');
let code = fs.readFileSync('/tmp/qobuz-mobile-v2/src/screens/DownloadsScreen.tsx', 'utf8');
const start = code.indexOf('const renderDownloadCard');
const end = code.indexOf('const renderHeader');
console.log(code.substring(start, end));
