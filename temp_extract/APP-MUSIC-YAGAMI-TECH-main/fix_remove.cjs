const fs = require('fs');

let code = fs.readFileSync('src/components/DownloadsTab.tsx', 'utf8');

const injection = `
import { WebStorage } from '../lib/WebStorage';
`;

code = code.replace("import { usePlayer } from './PlayerContext';", "import { usePlayer } from './PlayerContext';\n" + injection);

const originalRemove = `              if (lp) {
                  try {
                      await Filesystem.deleteFile({ directory: Directory.Data, path: lp.replace('file://', '') });
                  } catch(e){}
              }`;

const newRemove = `              if (lp) {
                  try {
                      if (lp.startsWith('webdb://')) {
                          await WebStorage.removeBlob(lp.replace('webdb://', ''));
                      } else {
                          await Filesystem.deleteFile({ directory: Directory.Data, path: lp.replace('file://', '') });
                      }
                  } catch(e){}
              }`;

code = code.replace(originalRemove, newRemove);
fs.writeFileSync('src/components/DownloadsTab.tsx', code);
console.log('done');
