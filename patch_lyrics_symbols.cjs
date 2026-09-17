const fs = require('fs');
let code = fs.readFileSync('src/components/ExpandedPlayer.tsx', 'utf8');

code = code.replace(
  /className="text-white\/60 text-\[1\.35rem\] leading-\[1\.4\] font-bold mb-7 transition-all duration-500 ease-\[cubic-bezier\(0\.19,1,0\.22,1\)\] origin-center"/,
  'className="text-white/60 text-[1.35rem] leading-[1.4] font-bold mb-7 transition-all duration-500 ease-[cubic-bezier(0.19,1,0.22,1)] origin-center flex flex-col items-center gap-1.5"'
);

code = code.replace(
  /\{line\.text\}/,
  `{line.text.split('^').map((part, i) => (
                            <span key={i} className={i > 0 ? "text-[0.75em] font-medium opacity-75 mt-0.5" : ""}>{part}</span>
                          ))}`
);

fs.writeFileSync('src/components/ExpandedPlayer.tsx', code);
