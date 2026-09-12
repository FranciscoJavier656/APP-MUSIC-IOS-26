import { Settings as SettingsIcon, Shield, Database, Key, Moon } from 'lucide-react';

interface SettingsTabProps {
  isDarkMode: boolean;
  setIsDarkMode: (val: boolean) => void;
}

export default function SettingsTab({ isDarkMode, setIsDarkMode }: SettingsTabProps) {
  return (
    <div className="flex flex-col h-full w-full bg-[#F2F2F7] dark:bg-[#000000]">
      {/* iOS style sticky header with blur */}
      <header className="sticky top-0 z-40 bg-[#F2F2F7]/80 dark:bg-[#000000]/80 backdrop-blur-xl px-8 pt-12 pb-4">
        <h1 className="text-4xl font-bold tracking-tight text-black dark:text-white">Ajustes</h1>
      </header>

      <div className="flex-1 px-8 pb-[180px] overflow-y-auto space-y-8">
        
        <section>
          <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 ml-2">Apariencia</h2>
          <div className="bg-white dark:bg-[#1C1C1E] rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden">
            <div className="p-4 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-indigo-500/10 text-indigo-500 rounded-lg">
                  <Moon className="w-5 h-5 fill-current" />
                </div>
                <span className="text-base font-medium text-black dark:text-white">Modo Oscuro</span>
              </div>
              <button 
                onClick={() => setIsDarkMode(!isDarkMode)}
                className={`w-14 h-8 flex items-center rounded-full p-1 transition-colors duration-300 ${isDarkMode ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-700'}`}
              >
                <div className={`bg-white w-6 h-6 rounded-full shadow-md transform transition-transform duration-300 ${isDarkMode ? 'translate-x-6' : 'translate-x-0'}`}></div>
              </button>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 ml-2">API Configuration</h2>
          <div className="bg-white dark:bg-[#1C1C1E] rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden">
            <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex items-center space-x-3">
              <div className="p-2 bg-[#007AFF]/10 text-[#007AFF] rounded-lg">
                <Database className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-lg leading-tight truncate text-black dark:text-white">Qobuz API</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">Configure your Qobuz integration</p>
              </div>
            </div>
            
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-400 mb-1">APP ID</label>
                <div className="relative">
                  <input type="password" placeholder="Configured via .env" disabled className="w-full bg-[#E3E3E8]/50 dark:bg-black/50 border border-gray-100 dark:border-gray-800 rounded-xl px-3 py-2 text-sm text-gray-500 dark:text-gray-400 cursor-not-allowed" />
                  <Key className="absolute right-3 top-2.5 w-4 h-4 text-gray-400 dark:text-gray-500" />
                </div>
              </div>
              
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-400 mb-1">APP SECRET</label>
                <div className="relative">
                  <input type="password" placeholder="Configured via .env" disabled className="w-full bg-[#E3E3E8]/50 dark:bg-black/50 border border-gray-100 dark:border-gray-800 rounded-xl px-3 py-2 text-sm text-gray-500 dark:text-gray-400 cursor-not-allowed" />
                  <Shield className="absolute right-3 top-2.5 w-4 h-4 text-gray-400 dark:text-gray-500" />
                </div>
              </div>

              <div className="bg-[#E3E3E8]/30 dark:bg-[#2C2C2E]/50 p-3 rounded-xl text-xs text-gray-600 dark:text-gray-400 border border-gray-100 dark:border-gray-800">
                <p>For security reasons, API credentials must be configured securely in your server's <code className="bg-gray-200 dark:bg-gray-800 px-1 py-0.5 rounded">.env</code> file. Do not enter them directly in the browser.</p>
              </div>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 ml-2">About</h2>
          <div className="bg-white dark:bg-[#1C1C1E] rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden">
            <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
              <span className="text-base font-medium text-black dark:text-white">Version</span>
              <span className="text-base text-gray-500 dark:text-gray-400">1.0.0</span>
            </div>
            <div className="p-4 flex items-center justify-between">
              <span className="text-base font-medium text-black dark:text-white">Powered By</span>
              <span className="text-base text-gray-500 dark:text-gray-400">Qobuz API & Gemini AI</span>
            </div>
          </div>
        </section>
        
      </div>
    </div>
  );
}
