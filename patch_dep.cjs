const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(
  `    return () => { \n      if (listener && typeof listener.remove === 'function') {\n        listener.remove().catch(e => console.warn(e));\n      }\n    };\n  }, []);`,
  `    return () => { \n      if (listener && typeof listener.remove === 'function') {\n        listener.remove().catch(e => console.warn(e));\n      }\n    };\n  }, [isAppLoading]);`
);

fs.writeFileSync('src/App.tsx', code);
console.log("Patched deps");
