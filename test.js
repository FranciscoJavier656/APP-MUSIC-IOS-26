import fs from 'fs';
let content = fs.readFileSync('src/components/LogsTab.tsx', 'utf8');
console.log(content.includes('Capacitor.isNativePlatform'));
