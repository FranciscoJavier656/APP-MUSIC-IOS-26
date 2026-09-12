const fs = require('fs');

function updatePadding(file) {
    let content = fs.readFileSync(file, 'utf8');
    content = content.replace(/pb-24/g, 'pb-[180px]');
    fs.writeFileSync(file, content);
}

updatePadding('src/components/HomeTab.tsx');
updatePadding('src/components/SearchTab.tsx');
updatePadding('src/components/LibraryTab.tsx');
updatePadding('src/components/DownloadsTab.tsx');

console.log("Padding updated for all tabs");
