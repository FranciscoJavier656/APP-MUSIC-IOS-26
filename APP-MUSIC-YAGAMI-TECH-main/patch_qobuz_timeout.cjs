const fs = require('fs');
let code = fs.readFileSync('src/lib/qobuz.ts', 'utf8');

if (!code.includes('axios.defaults.timeout')) {
  code = code.replace("import axios from 'axios';", "import axios from 'axios';\naxios.defaults.timeout = 15000;");
  fs.writeFileSync('src/lib/qobuz.ts', code);
}
