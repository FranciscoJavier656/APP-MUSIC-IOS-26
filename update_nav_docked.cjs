const fs = require('fs');

let appCode = fs.readFileSync('src/App.tsx', 'utf8');

const navStart = appCode.indexOf('{/* Floating Transparent Tab Bar */}');
const navEnd = appCode.indexOf('</nav>', navStart) + 6;

const newNav = `{/* Docked Modern Tab Bar */}
        <nav className="absolute bottom-0 left-0 w-full h-[88px] bg-white/85 dark:bg-[#1C1C1E]/85 backdrop-blur-3xl border-t border-black/5 dark:border-white/10 flex justify-center z-50">
          <div className="flex items-start justify-between w-full max-w-[450px] px-4 pt-3">
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
                  className={\`relative flex items-center justify-center gap-2 px-3.5 py-2 rounded-full transition-all duration-300 ease-out \${
                    isActive 
                      ? 'text-white' 
                      : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }\`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="active-tab-indicator"
                      className="absolute inset-0 bg-[#007AFF] rounded-full z-0 shadow-md"
                      transition={{ type: "spring", stiffness: 350, damping: 30 }}
                    />
                  )}
                  <Icon size={24} strokeWidth={isActive ? 2.5 : 2} className="relative z-10" />
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
          </div>
        </nav>`;

appCode = appCode.substring(0, navStart) + newNav + appCode.substring(navEnd);
fs.writeFileSync('src/App.tsx', appCode);

// Update MiniPlayer bottom padding
let miniPlayerCode = fs.readFileSync('src/components/MiniPlayer.tsx', 'utf8');
miniPlayerCode = miniPlayerCode.replace(/bottom-\[[0-9]+px\]/g, 'bottom-[92px]');
fs.writeFileSync('src/components/MiniPlayer.tsx', miniPlayerCode);

console.log("Nav bar docked to bottom successfully");
