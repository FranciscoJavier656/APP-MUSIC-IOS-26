const { execSync } = require('child_process');
try {
  execSync('ffmpeg -version');
  console.log('ffmpeg works via child_process');
} catch (e) {
  console.error(e);
}
