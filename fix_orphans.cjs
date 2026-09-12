const xcode = require('xcode');
const fs = require('fs');
const projectPath = 'ios/App/App.xcodeproj/project.pbxproj';
const myProj = xcode.project(projectPath);

myProj.parse(function (err) {
    if (err) return;
    
    // Find the PBXGroup that has path = App
    let appGroup = null;
    const groups = myProj.hash.project.objects['PBXGroup'];
    for (let key in groups) {
        if (groups[key] && groups[key].path === 'App' || groups[key].name === 'App') {
            appGroup = groups[key];
            break;
        }
    }
    
    if (!appGroup) {
        console.error("App group not found");
        return;
    }
    
    const orphans = [
        { name: 'QobuzAudioPlugin.swift', key: '6B260D131F0C4E0BA914CDCA' },
        { name: 'QobuzAudioPlugin.m', key: '11CCA424236949A7B8E08231' }
    ];
    
    orphans.forEach(o => {
        const fileRef = myProj.hash.project.objects['PBXFileReference'][o.key];
        if (fileRef) {
            fileRef.path = '"' + o.name + '"'; // wrap in quotes just to match xcode library format
        }
        
        const alreadyInGroup = appGroup.children.find(c => c.value === o.key);
        if (!alreadyInGroup) {
            appGroup.children.push({
                value: o.key,
                comment: o.name
            });
        }
    });

    fs.writeFileSync(projectPath, myProj.writeSync());
    console.log("Fixed orphans!");
});
