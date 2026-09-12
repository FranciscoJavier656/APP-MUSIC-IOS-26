const fs = require('fs');
let code = fs.readFileSync('src/components/DownloadsTab.tsx', 'utf8');

code = code.replace("import { WebStorage } from '../lib/WebStorage';\n", "");

const newRemove = `              if (lp) {
                  try {
                      if (lp.startsWith('webdb://')) {
                          await WebStorage.removeBlob(lp.replace('webdb://', ''));
                      } else {
                          await Filesystem.deleteFile({ directory: Directory.Data, path: lp.replace('file://', '') });
                      }
                  } catch(e){}
              }`;

const originalRemove = `              if (lp) {
                  try {
                      await Filesystem.deleteFile({ directory: Directory.Data, path: lp.replace('file://', '') });
                  } catch(e){}
              }`;

code = code.replace(newRemove, originalRemove);
fs.writeFileSync('src/components/DownloadsTab.tsx', code);
console.log('done');
