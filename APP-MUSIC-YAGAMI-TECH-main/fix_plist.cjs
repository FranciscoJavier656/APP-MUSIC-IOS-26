const fs = require('fs');
let code = fs.readFileSync('ios/App/App/Info.plist', 'utf8');

// Remove it from the wrong place
code = code.replace('\t<key>UIBackgroundModes</key>\n\t<array>\n\t\t<string>audio</string>\n\t</array>', '');

// Insert it at the top level
const insertAt = code.indexOf('<dict>') + '<dict>'.length;
const bgMode = '\n\t<key>UIBackgroundModes</key>\n\t<array>\n\t\t<string>audio</string>\n\t</array>';

code = code.substring(0, insertAt) + bgMode + code.substring(insertAt);

fs.writeFileSync('ios/App/App/Info.plist', code);
