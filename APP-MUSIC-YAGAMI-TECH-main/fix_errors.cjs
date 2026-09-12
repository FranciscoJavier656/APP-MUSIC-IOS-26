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
    [/a >> a\.id/g, 'a => a.id'],
    [/c >> !activeIds/g, 'c => !activeIds'],
    [/d >> \['downloading'/g, 'd => [\'downloading\''],
    [/d >> d\.status/g, 'd => d.status'],
    [/!>>/g, '!==']
]);

fix('src/components/OfflineDetailView.tsx', [
    [/q >> q\.id/g, 'q => q.id'],
    [/q >> q/g, 'q => q']
]);

fix('src/components/ParaTiSection.tsx', [
    [/g >> g\.id/g, 'g => g.id'],
    [/g >> g/g, 'g => g'],
    [/a >> a/g, 'a => a']
]);

fix('src/components/PlayerContext.tsx', [
    [/l >> l\.id/g, 'l => l.id'],
    [/l >> l/g, 'l => l']
]);

