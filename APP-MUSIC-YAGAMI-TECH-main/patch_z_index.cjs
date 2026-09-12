const fs = require('fs');
let code = fs.readFileSync('ios/App/App/LiquidTabBarPlugin.swift', 'utf8');

code = code.replace(
    'viewController.view.addSubview(host.view)',
    'viewController.view.addSubview(host.view)\n                    viewController.view.bringSubviewToFront(host.view)\n                    host.view.layer.zPosition = 9999'
);

fs.writeFileSync('ios/App/App/LiquidTabBarPlugin.swift', code);
console.log("Patched z-index!");
