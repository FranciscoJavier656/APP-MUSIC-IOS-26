const fs = require('fs');

let code = fs.readFileSync('src/App.tsx', 'utf8');

const newNavBar = `
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={\`relative flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-full transition-colors duration-300 \${
                    isActive 
                      ? 'text-white' 
                      : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }\`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="active-tab-indicator"
                      className="absolute inset-0 bg-[#007AFF] rounded-full z-0 shadow-md"
                      transition={{ type: "spring", stiffness: 400, damping: 25, mass: 0.8 }}
                    />
                  )}
                  <Icon size={22} strokeWidth={isActive ? 2.5 : 2} className="relative z-10" />
                  <AnimatePresence initial={false}>
                    {isActive && (
                      <motion.span 
                        layout
                        initial={{ opacity: 0, width: 0 }}
                        animate={{ opacity: 1, width: 'auto' }}
                        exit={{ opacity: 0, width: 0 }}
                        transition={{ type: "spring", stiffness: 400, damping: 25, mass: 0.8 }}
                        className="relative z-10 text-[11px] font-bold uppercase tracking-wide whitespace-nowrap overflow-hidden"
                      >
                        {tab.label}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </button>
`;

code = code.replace(
  /<button\s*key=\{tab\.id\}\s*onClick=\{\(\) => setActiveTab\(tab\.id as any\)\}[\s\S]*?<\/button>/,
  newNavBar.trim()
);

fs.writeFileSync('src/App.tsx', code);
