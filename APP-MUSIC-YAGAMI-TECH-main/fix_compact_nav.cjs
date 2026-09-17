const fs = require('fs');

let appCode = fs.readFileSync('src/App.tsx', 'utf8');
const navStart = appCode.indexOf('{/* Floating Premium Tab Bar */}');
const navEnd = appCode.indexOf('</nav>', navStart) + 6;

const newNav = `{/* Compact Docked Tab Bar */}
        <nav className="absolute bottom-0 left-0 w-full h-[64px] bg-[#F9F9F9]/95 dark:bg-[#1C1C1E]/95 backdrop-blur-3xl border-t border-black/5 dark:border-white/10 flex justify-center z-50 pb-[env(safe-area-inset-bottom)] transition-colors duration-300">
          <div className="flex items-center justify-around w-full max-w-[450px] px-2 h-full">
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
                  className={\`flex flex-col items-center justify-center w-full h-full gap-1 transition-colors \${
                    isActive 
                      ? 'text-[#007AFF]' 
                      : 'text-gray-400 dark:text-gray-500 hover:text-gray-800 dark:hover:text-gray-300'
                  }\`}
                >
                  <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
                  <span className="text-[9px] font-semibold uppercase tracking-tight">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </nav>`;

appCode = appCode.substring(0, navStart) + newNav + appCode.substring(navEnd);
fs.writeFileSync('src/App.tsx', appCode);

let miniPlayerCode = fs.readFileSync('src/components/MiniPlayer.tsx', 'utf8');
miniPlayerCode = miniPlayerCode.replace(/bottom-\[[a-zA-Z0-9_\-\(\)]+\]/g, 'bottom-[68px]');
fs.writeFileSync('src/components/MiniPlayer.tsx', miniPlayerCode);

console.log("Nav bar updated to compact docked mode");
