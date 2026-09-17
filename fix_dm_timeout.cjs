const fs = require('fs');
let code = fs.readFileSync('src/lib/DownloadManager.ts', 'utf8');

const oldDlWeb = `export const downloadFileWeb = async (url: string, filename: string) => {
  const res = await axios.get(url, { responseType: 'blob' });`;

const newDlWeb = `export const downloadFileWeb = async (url: string, filename: string) => {
  // Override global timeout to 0 (no timeout) for large file downloads
  const res = await axios.get(url, { responseType: 'blob', timeout: 0 });`;

if (code.includes(oldDlWeb)) {
    code = code.replace(oldDlWeb, newDlWeb);
    fs.writeFileSync('src/lib/DownloadManager.ts', code);
    console.log('Fixed timeout in DM');
} else {
    console.log('Could not find downloadFileWeb block');
}
