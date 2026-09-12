const fs = require('fs');
let code = fs.readFileSync('src/lib/qobuz.ts', 'utf8');

code = code.replace("import axios from 'axios';", "import axios from 'axios';\nimport { Capacitor } from '@capacitor/core';\n\nconst API_BASE = Capacitor.isNativePlatform() ? 'https://ais-pre-pssjmmwet2liei6r6ofh3r-237034068613.us-west1.run.app' : '';\n");

code = code.replace(/axios\.get\(\`/g, "axios.get(`${API_BASE}");
// Wait, backticks are used as `/api/search`, so axios.get(`/api/search` needs to become axios.get(`${API_BASE}/api/search`

code = code.replace(/axios\.get\(\`\/api\//g, "axios.get(`${API_BASE}/api/");

fs.writeFileSync('src/lib/qobuz.ts', code);
