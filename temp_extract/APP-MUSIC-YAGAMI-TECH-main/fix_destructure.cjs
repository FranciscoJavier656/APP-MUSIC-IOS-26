const fs = require('fs');
const glob = require('glob');
const path = require('path');

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
    
    // Fix const { ... } > ...
    content = content.replace(/const\s+\{([^}]+)\}\s*>\s*/g, 'const {$1} = ');
    // Fix let { ... } > ...
    content = content.replace(/let\s+\{([^}]+)\}\s*>\s*/g, 'let {$1} = ');

    fs.writeFileSync(file, content);
});
console.log("Done");
