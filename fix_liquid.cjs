const fs = require('fs');
const path = 'src/components/LiquidTabBar.tsx';
let content = fs.readFileSync(path, 'utf8');

// Fix the react import issue
content = content.replace("import React, { useRef, useState, useEffect } from 'react';", "import * as React from 'react';\nimport { useRef, useState, useEffect } from 'react';");

fs.writeFileSync(path, content, 'utf8');
console.log("Fixed React import!");
