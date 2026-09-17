const fs = require('fs');
let code = fs.readFileSync('ios/App/App/QobuzAudioPlugin.m', 'utf8');

// Remove the include from inside the method
code = code.replace('    #include <sys/xattr.h>\n', '');

// Add the include at the top of the file, after the last #import
if (!code.includes('#include <sys/xattr.h>')) {
  code = code.replace('#import <Accelerate/Accelerate.h>', '#import <Accelerate/Accelerate.h>\n#include <sys/xattr.h>');
}

fs.writeFileSync('ios/App/App/QobuzAudioPlugin.m', code);
console.log("Fixed QobuzAudioPlugin.m");
