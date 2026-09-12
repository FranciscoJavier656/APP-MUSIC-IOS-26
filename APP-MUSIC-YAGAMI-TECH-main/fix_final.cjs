const fs = require('fs');

function fix(file, replacements) {
    if (!fs.existsSync(file)) return;
    let code = fs.readFileSync(file, 'utf8');
    for (let [search, replace] of replacements) {
        code = code.replace(search, replace);
    }
    fs.writeFileSync(file, code);
}

fix('src/components/DownloadModal.tsx', [
    [/r >> setTimeout/g, 'r => setTimeout']
]);

fix('src/components/DownloadsTab.tsx', [
    [/activeDownloadList\.map\(dl =>/g, 'activeDownloadList.map((dl: any) =>']
]);

fix('src/components/ErrorBoundary.tsx', [
    [/class ErrorBoundary extends Component/g, 'class ErrorBoundary extends React.Component']
]);

fix('src/components/ExpandedPlayer.tsx', [
    [/current => lyricsArray\[i\]\.time/g, 'current >= lyricsArray[i].time']
]);
