const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const target = `    initPlugin();
    
    return () => { 
      if (listener && typeof listener.remove === 'function') {
        listener.remove().catch(e => console.warn(e));
      }
    };
  }, [isAppLoading]);`;

const replacement = `    initPlugin();
    
    return () => { 
      if (listener && typeof listener.remove === 'function') {
        listener.remove().catch(e => console.warn(e));
      }
    };
  }, [showUI]);`;

code = code.replace(target, replacement);

fs.writeFileSync('src/App.tsx', code);
console.log("Patched App.tsx dependency array!");
