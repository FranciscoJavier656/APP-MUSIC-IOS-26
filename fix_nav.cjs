const fs = require('fs');

let appCode = fs.readFileSync('src/App.tsx', 'utf8');

const navStart = appCode.indexOf('{/* Floating Dynamic Glass Tab Bar */}');
const navEnd = appCode.indexOf('</nav>', navStart) + 6;

const newNav = `{/* Floating Transparent Tab Bar */}
        <nav className="absolute bottom-6 left-1/2 -translate-x-1/2 h-[68px] flex items-center justify-between px-2 z-50 w-[96%] max-w-[400px] pointer-events-none">
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
                className={\`pointer-events-auto relative flex items-center justify-center gap-2 px-4 py-3 rounded-full transition-all duration-300 ease-out backdrop-blur-xl border \${
                  isActive 
                    ? 'text-white shadow-lg bg-[#007AFF] border-[#007AFF]/20' 
                    : 'text-gray-600 dark:text-gray-300 bg-white/70 dark:bg-black/40 border-black/5 dark:border-white/10 hover:bg-white/90 dark:hover:bg-black/60'
                }\`}
              >
                {isActive && (
                  <motion.div
                    layoutId="active-tab-indicator"
                    className="absolute inset-0 bg-[#007AFF] rounded-full z-0"
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
fs.writeFileSync('src/App.tsx', appCode);

console.log("Nav bar updated to transparent separated buttons");
