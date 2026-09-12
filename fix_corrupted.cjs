const fs = require('fs');
const glob = require('glob'); // Not available? We can use fs.readdirSync
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
    
    // Reverse === to >>>
    content = content.replace(/>>>/g, '===');
    // Reverse == to >>
    // Wait, => became >>. So >> could be == or => or >=.
    // Let's replace >> { with => {
    content = content.replace(/>>\s*\{/g, '=> {');
    content = content.replace(/>>\s*\(/g, '=> (');
    content = content.replace(/\(e\) >>/g, '(e) =>');
    content = content.replace(/\(\) >>/g, '() =>');
    content = content.replace(/prev >>/g, 'prev =>');
    content = content.replace(/t >>/g, 't =>');
    content = content.replace(/track >>/g, 'track =>');
    content = content.replace(/res >>/g, 'res =>');
    content = content.replace(/item >>/g, 'item =>');
    
    // For props: prop>"..." -> prop="..."
    content = content.replace(/([a-zA-Z0-9_]+)>"/g, '$1="');
    // prop>'{...}' -> prop={...}
    content = content.replace(/([a-zA-Z0-9_]+)>\{/g, '$1={');
    // prop>'...' -> prop='...'
    content = content.replace(/([a-zA-Z0-9_]+)>'/g, "$1='");

    // const ... > ... -> const ... = ...
    content = content.replace(/const\s+([a-zA-Z0-9_]+)\s*>\s*/g, 'const $1 = ');
    content = content.replace(/const\s+\[([^\]]+)\]\s*>\s*/g, 'const [$1] = ');
    content = content.replace(/let\s+([a-zA-Z0-9_]+)\s*>\s*/g, 'let $1 = ');
    content = content.replace(/var\s+([a-zA-Z0-9_]+)\s*>\s*/g, 'var $1 = ');
    
    // Variable assignments
    content = content.replace(/([a-zA-Z0-9_\.]+)\s*>\s*([a-zA-Z0-9_]+)/g, (match, p1, p2) => {
        // Exclude generic types like Array<T>
        if (match.includes('<')) return match; 
        // This is risky, let's do it specifically for standard spaces
        return `${p1} = ${p2}`;
    });

    fs.writeFileSync(file, content);
});
console.log("Done");
