const fs = require('fs');
let expandedCode = fs.readFileSync('src/components/ExpandedPlayer.tsx', 'utf8');

expandedCode = expandedCode.replace(
  /        <\/div>\n      <\/div>\n\n      \{\/\* Audio Visualizer Canvas \*\/\}/,
  '        </motion.div>\n      </div>\n\n      {/* Audio Visualizer Canvas */}'
);

fs.writeFileSync('src/components/ExpandedPlayer.tsx', expandedCode);
