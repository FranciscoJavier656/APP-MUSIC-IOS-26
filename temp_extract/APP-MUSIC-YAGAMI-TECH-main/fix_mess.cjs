const fs = require('fs');
let code = fs.readFileSync('ios/App/App/QobuzAudioPlugin.m', 'utf8');

const startStr = '@implementation QobuzAudioPlugin\n\n- (void)setupRemoteControls';
const start = code.indexOf(startStr);
if (start !== -1) {
    const end = code.indexOf(' (CAPPluginCategory)', start);
    if (end !== -1) {
        let block = code.substring(start, end + ' (CAPPluginCategory)'.length);
        
        let methodStart = block.indexOf('- (void)setupRemoteControls:');
        let methodsString = block.substring(methodStart, block.length - ' (CAPPluginCategory)'.length);
        
        code = code.substring(0, start) + '@implementation QobuzAudioPlugin (CAPPluginCategory)' + code.substring(start + block.length);
        
        code = code.replace('@implementation QobuzAudioPlugin\n', '@implementation QobuzAudioPlugin\n\n' + methodsString + '\n');
        
        fs.writeFileSync('ios/App/App/QobuzAudioPlugin.m', code);
        console.log("Success!");
    } else {
        console.log("End not found");
    }
} else {
    console.log("Start not found");
}
