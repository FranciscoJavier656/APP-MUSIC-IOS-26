const fs = require('fs');
let code = fs.readFileSync('src/components/ExpandedPlayer.tsx', 'utf8');

code = code.replace(
  /\{lyrics\}/,
  `{lyrics.split('\\n').map((line, i) => (
                          <div key={i}>
                            {line.split('^').map((part, j) => (
                              <span key={j} className={j > 0 ? "block text-[0.8em] font-medium opacity-75 mt-1" : "block"}>{part}</span>
                            ))}
                          </div>
                        ))}`
);

fs.writeFileSync('src/components/ExpandedPlayer.tsx', code);
