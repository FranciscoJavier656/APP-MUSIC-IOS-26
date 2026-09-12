const fs = require('fs');
let code = fs.readFileSync('ios/App/App/QobuzAudioPlugin.m', 'utf8');

// I will just download the original file before my changes, or manually reconstruct it.
// Wait, the file is not entirely broken, it's just that the first @implementation block was mangled.
// Let's print lines 20 to 120
