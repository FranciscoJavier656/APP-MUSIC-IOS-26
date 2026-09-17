const fs = require('fs');

let appCode = fs.readFileSync('src/App.tsx', 'utf8');
const navStart = appCode.indexOf('{/* Compact Docked Tab Bar */}');
const navEnd = appCode.indexOf('</nav>', navStart) + 6;

const newNav = `{/* Docked Modern Tab Bar with Pills */}
        <nav className="absolute bottom-0 left-0 w-full h-[72px] bg-[#F2F2F7]/95 dark:bg-[#000000]/95 backdrop-blur-3xl border-t border-black/5 dark:border-white/10 flex justify-center z-50 pb-[env(safe-area-inset-bottom)]">
          <div className="flex items-center justify-between w-full max-w-[450px] px-3 h-full">
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
                  className={\`relative flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-full transition-all duration-300 ease-out \${
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
                  <Icon size={22} strokeWidth={isActive ? 2.5 : 2} className="relative z-10" />
                  {isActive && (
                    <motion.span 
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: 'auto' }}
                      exit={{ opacity: 0, width: 0 }}
                      className="relative z-10 text-[11px] font-bold uppercase tracking-wide whitespace-nowrap overflow-hidden"
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

let miniPlayerCode = fs.readFileSync('src/components/MiniPlayer.tsx', 'utf8');
miniPlayerCode = miniPlayerCode.replace(/bottom-\[[a-zA-Z0-9_\-\(\)]+\]/g, 'bottom-[72px]');
fs.writeFileSync('src/components/MiniPlayer.tsx', miniPlayerCode);

console.log("Nav bar restored modern pills but kept it compact and docked");
