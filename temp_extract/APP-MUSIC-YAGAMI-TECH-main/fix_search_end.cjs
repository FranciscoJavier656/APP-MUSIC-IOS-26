const fs = require('fs');
let code = fs.readFileSync('src/components/SearchTab.tsx', 'utf8');

if (!code.endsWith('    </div>\n    </div>\n  );\n}\n') && !code.endsWith('    </div>\n    </div>\n  );\n}')) {
  code = code.replace(/    <\/div>\s*\);\s*}\s*$/g, '    </div>\n    </div>\n  );\n}\n');
  fs.writeFileSync('src/components/SearchTab.tsx', code);
}
