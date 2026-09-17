const fs = require('fs');
let code = fs.readFileSync('src/components/ExpandedPlayer.tsx', 'utf8');

const faultyBrackets = `                    }
                }
                }
            }`;
const fixedBrackets = `                    }
                }
            }`;

code = code.replace(faultyBrackets, fixedBrackets);
fs.writeFileSync('src/components/ExpandedPlayer.tsx', code);
