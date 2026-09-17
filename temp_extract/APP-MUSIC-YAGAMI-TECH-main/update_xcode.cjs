const xcode = require('xcode');
const fs = require('fs');
const projectPath = 'ios/App/App.xcodeproj/project.pbxproj';
const myProj = xcode.project(projectPath);

myProj.parse(function (err) {
    if (err) {
        console.error("Error parsing pbxproj:", err);
        return;
    }
    
    const filesToAdd = [
        'ios/App/App/LiquidTabBarPlugin.swift',
        'ios/App/App/LiquidTabBarPlugin_Register.m',
        'ios/App/App/QobuzAudioPlugin_Register.m',
        'ios/App/App/YagamiDownloadManager_Register.m'
    ];
    
    // Check and add each file
    filesToAdd.forEach(filePath => {
        // App group is usually where App files go, let's just add to project
        myProj.addSourceFile(filePath.replace('ios/App/', ''), null, myProj.findPBXGroupKey({name: 'App'}));
    });
    
    fs.writeFileSync(projectPath, myProj.writeSync());
    console.log("Xcode project updated successfully with missing plugin files!");
});
