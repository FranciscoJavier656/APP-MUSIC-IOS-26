const xcode = require('xcode');
const projectPath = 'ios/App/App.xcodeproj/project.pbxproj';
const myProj = xcode.project(projectPath);

myProj.parse(function (err) {
    if (err) return;
    
    // Check all PBXFileReference paths
    const fileRefs = myProj.hash.project.objects['PBXFileReference'];
    for (let key in fileRefs) {
        if (!fileRefs[key] || typeof fileRefs[key] !== 'object') continue;
        const name = fileRefs[key].name;
        if (name && (name.includes('Plugin') || name.includes('Manager'))) {
            console.log(name, "-> path:", fileRefs[key].path);
            
            // Check which group it's in
            let foundIn = "NO GROUP";
            const groups = myProj.hash.project.objects['PBXGroup'];
            for (let gKey in groups) {
                if (groups[gKey] && groups[gKey].children) {
                    if (groups[gKey].children.find(c => c.value === key)) {
                        foundIn = groups[gKey].name || groups[gKey].path || "ROOT";
                        break;
                    }
                }
            }
            console.log("  -> group:", foundIn);
        }
    }
});
