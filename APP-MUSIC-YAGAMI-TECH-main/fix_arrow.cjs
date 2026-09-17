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
    
    // >> void -> => void
    content = content.replace(/>>\s*void/g, '=> void');
    // ) >> -> ) =>
    content = content.replace(/\)\s*>>\s*/g, ') => ');

    fs.writeFileSync(file, content);
});
console.log("Done");
