const fs = require('fs');
let code = fs.readFileSync('src/components/ErrorBoundary.tsx', 'utf8');
code = code.replace("hasError: boolean;", "hasError: boolean;\n  errorMsg?: string;");
code = code.replace("hasError: false", "hasError: false,\n    errorMsg: undefined");
code = code.replace("return { hasError: true };", "return { hasError: true, errorMsg: _?.message || String(_) };");
code = code.replace("<h2 className=\"text-lg font-semibold mb-2\">Algo salió mal</h2>", "<h2 className=\"text-lg font-semibold mb-2\">Algo salió mal</h2>\n          <p className=\"text-xs text-red-400 mb-2 font-mono\">{this.state.errorMsg}</p>");
fs.writeFileSync('src/components/ErrorBoundary.tsx', code);
