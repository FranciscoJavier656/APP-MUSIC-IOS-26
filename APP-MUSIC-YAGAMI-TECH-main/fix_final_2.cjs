const fs = require('fs');

function fix(file, replacements) {
    if (!fs.existsSync(file)) return;
    let code = fs.readFileSync(file, 'utf8');
    for (let [search, replace] of replacements) {
        code = code.replace(search, replace);
    }
    fs.writeFileSync(file, code);
}

fix('src/components/DownloadsTab.tsx', [
    [/stats\.totalDownloads = 0 \?/g, 'stats.totalDownloads > 0 ?'],
    [/item\.progress\?\.bytes/g, '(item.progress as any)?.bytes'],
    [/(id: dl\.trackId,[\s\S]+?status: dl\.status,)/g, '$1\n      error: dl.error']
]);

fix('src/components/PlayerContext.tsx', [
    [/type: 'album'\|'track'/g, "type: 'album'|'track'|'playlist'"]
]);

