const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');
code = code.replace("import { useState, useEffect } from 'react';", "import React, { useState, useEffect } from 'react';");
fs.writeFileSync('src/App.tsx', code);
console.log("Fixed React import!");
