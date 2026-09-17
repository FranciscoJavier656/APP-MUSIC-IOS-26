const fs = require('fs');
let code = fs.readFileSync('vite.config.ts', 'utf8');
if (!code.includes("base: './'")) {
  code = code.replace("plugins: [react(), tailwindcss()],", "base: './',\n    plugins: [react(), tailwindcss()],");
  fs.writeFileSync('vite.config.ts', code);
  console.log("Added base: './' to vite.config.ts");
}
