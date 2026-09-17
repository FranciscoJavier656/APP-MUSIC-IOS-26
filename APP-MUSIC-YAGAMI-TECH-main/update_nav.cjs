const fs = require('fs');

let appCode = fs.readFileSync('src/App.tsx', 'utf8');

// 1. Update MiniPlayer spacing
let miniPlayerCode = fs.readFileSync('src/components/MiniPlayer.tsx', 'utf8');
miniPlayerCode = miniPlayerCode.replace('bottom-[92px]', 'bottom-[100px]');
fs.writeFileSync('src/components/MiniPlayer.tsx', miniPlayerCode);

// 2. Rewrite the nav bar in App.tsx
// Find the nav element replacement
const navStart = appCode.indexOf('{/* iOS Style Bottom Tab Bar */}');
const navEnd = appCode.indexOf('</nav>', navStart) + 6;

const newNav = `{/* Floating Dynamic Glass Tab Bar */}
        <nav className="absolute bottom-6 left-1/2 -translate-x-1/2 h-[68px] bg-white/70 dark:bg-[#2C2C2E]/70 backdrop-blur-2xl border border-black/5 dark:border-white/10 shadow-2xl flex items-center justify-between px-3 z-50 rounded-full transition-colors duration-300 w-[92%] max-w-[400px]">
          {[
            { id: 'home', icon: Home, label: 'Inicio' },
            { id: 'search', icon: Search, label: 'Buscar' },
            { id: 'library', icon: Library, label: 'Librería' },
            { id: 'downloads', icon: Download, label: 'Descargas' },
            { id: 'settings', icon: SettingsIcon, label: 'Ajustes' },
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={\`relative flex items-center justify-center gap-2 px-4 py-2.5 rounded-full transition-all duration-300 ease-out \${
                  isActive 
                    ? 'text-white dark:text-black shadow-md' 
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }\`}
              >
                {isActive && (
                  <motion.div
                    layoutId="active-tab-indicator"
                    className="absolute inset-0 bg-black dark:bg-white rounded-full z-0"
                    transition={{ type: "spring", stiffness: 350, damping: 30 }}
                  />
                )}
                <Icon size={22} strokeWidth={isActive ? 2.5 : 2} className="relative z-10" />
                {isActive && (
                  <motion.span 
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: 'auto' }}
                    exit={{ opacity: 0, width: 0 }}
                    className="relative z-10 text-xs font-bold uppercase tracking-wide whitespace-nowrap overflow-hidden"
                  >
                    {tab.label}
                  </motion.span>
                )}
              </button>
            );
          })}
        </nav>`;

appCode = appCode.substring(0, navStart) + newNav + appCode.substring(navEnd);
appCode = appCode.replace('pb-[88px]', 'pb-[110px]');
fs.writeFileSync('src/App.tsx', appCode);

console.log("Nav bar updated");
