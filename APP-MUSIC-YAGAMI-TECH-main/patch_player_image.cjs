const fs = require('fs');
const fallbackSrc = "e.currentTarget.src = 'https://placehold.co/400x400/1C1C1E/FFFFFF/png?text=Audio'";
const path = 'src/components/Player.tsx';
if (fs.existsSync(path)) {
  let code = fs.readFileSync(path, 'utf8');
  code = code.replace(/<img([^>]*)>/g, (match, p1) => {
    if (p1.includes('onError=')) return match;
    return `<img${p1} onError={(e) => { ${fallbackSrc} }}>`;
  });
  fs.writeFileSync(path, code);
}
