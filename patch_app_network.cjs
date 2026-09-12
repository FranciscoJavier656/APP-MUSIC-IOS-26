const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const targetImport = "import { DownloadProvider } from './lib/DownloadContext';";
const replaceImport = `import { DownloadProvider } from './lib/DownloadContext';\nimport { WifiOff } from 'lucide-react';\nimport { ErrorBoundary } from './components/ErrorBoundary';`;

const targetState = "  const [isAppLoading, setIsAppLoading] = useState(true);";
const replaceState = `  const [isAppLoading, setIsAppLoading] = useState(true);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);`;

const targetContent = `<main className="flex-1 overflow-y-auto pb-[88px] relative">`;
const replaceContent = `
        <AnimatePresence>
          {isOffline && (
            <motion.div
              initial={{ opacity: 0, y: -50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -50 }}
              className="absolute top-12 left-1/2 -translate-x-1/2 z-[90] bg-red-500/90 backdrop-blur-md text-white px-4 py-2 rounded-full text-xs font-semibold flex items-center gap-2 shadow-lg"
            >
              <WifiOff size={14} />
              Sin Conexión
            </motion.div>
          )}
        </AnimatePresence>
        <ErrorBoundary>
        <main className="flex-1 overflow-y-auto pb-[88px] relative">`;

const targetEndContent = `        </main>`;
const replaceEndContent = `        </main>
        </ErrorBoundary>`;

code = code.replace(targetImport, replaceImport);
code = code.replace(targetState, replaceState);
code = code.replace(targetContent, replaceContent);
code = code.replace(targetEndContent, replaceEndContent);

fs.writeFileSync('src/App.tsx', code);
