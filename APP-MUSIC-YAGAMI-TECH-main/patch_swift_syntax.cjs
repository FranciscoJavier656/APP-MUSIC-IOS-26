const fs = require('fs');
let code = fs.readFileSync('ios/App/App/LiquidTabBarPlugin.swift', 'utf8');

// Fix ForEach tuple id keypath which lost its backslash due to JS template literals
code = code.replace('ForEach(tabs, id: .0)', 'ForEach(tabs, id: \\.0)');

// Fix Material ShapeStyle usage to be 100% compatible with iOS 15 Shape constraints
code = code.replace('shape.background(.ultraThinMaterial)', 'shape.fill(.ultraThinMaterial)');

fs.writeFileSync('ios/App/App/LiquidTabBarPlugin.swift', code);
console.log("Patched Swift syntax errors!");
