const fs = require('fs');
let swiftCode = fs.readFileSync('ios/App/App/YagamiDownloadManager.swift', 'utf8');
if (!swiftCode.includes('import UIKit')) {
    swiftCode = swiftCode.replace('import Foundation', 'import Foundation\nimport UIKit');
    fs.writeFileSync('ios/App/App/YagamiDownloadManager.swift', swiftCode);
    console.log("Added UIKit!");
}
