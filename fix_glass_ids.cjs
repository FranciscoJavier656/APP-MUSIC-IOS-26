const fs = require('fs');
const path = 'ios/App/App/LiquidTabBarPlugin.swift';
let content = fs.readFileSync(path, 'utf8');

// The official WWDC25 syntax for SwiftUI glass union is:
// .glassEffectID("someId", in: namespace)
// NOT .glassEffectUnion(id: "liquid", namespace: glassNS)

// Let's replace the made up glassEffectUnion with glassEffectID

content = content.replace(/\.glassEffectUnion\(id: "liquid", namespace: glassNS\)/g, '.glassEffectID("liquid", in: glassNS)');

fs.writeFileSync(path, content);
console.log("Updated glassEffectID syntax to match WWDC25");
