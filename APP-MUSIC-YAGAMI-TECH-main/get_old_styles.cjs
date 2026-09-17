const fs = require('fs');
let code = fs.readFileSync('/tmp/qobuz-mobile-v2/src/screens/DownloadsScreen.tsx', 'utf8');
console.log(code.substring(code.indexOf('const renderDownloadCard')));
