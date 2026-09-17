const fs = require('fs');
let code = fs.readFileSync('src/components/HomeTab.tsx', 'utf8');

if (!code.endsWith('    </>\n  );\n}\n')) {
  code = code.replace(/    <\/div>\s*\);\s*}\s*$/g, '    </div>\n    </>\n  );\n}\n');
  fs.writeFileSync('src/components/HomeTab.tsx', code);
}
