const fs = require('fs');

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(function(file) {
        file = dir + '/' + file;
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) { 
            results = results.concat(walk(file));
        } else { 
            if (file.endsWith('.tsx') || file.endsWith('.ts')) results.push(file);
        }
    });
    return results;
}

const files = walk('src');

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    
    let changed = false;
    
    if (content.includes('!>>')) {
        content = content.replace(/!>>/g, '!==');
        changed = true;
    }

    if (file.includes('PlayerContext.tsx') && !content.includes('localCoverPath?: string;')) {
        content = content.replace('localPath?: string;', 'localPath?: string;\n  localCoverPath?: string;');
        changed = true;
    }

    if (changed) fs.writeFileSync(file, content);
});
console.log("Done");
