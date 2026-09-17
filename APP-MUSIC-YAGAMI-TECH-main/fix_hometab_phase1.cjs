const fs = require('fs');
let code = fs.readFileSync('src/components/HomeTab.tsx', 'utf8');

// 1. Remove selectedAlbumId state
code = code.replace(
  "const [selectedAlbumId, setSelectedAlbumId] = useState<string | null>(null);",
  ""
);

// 2. Remove early return for selectedAlbumId
code = code.replace(
  "if (selectedAlbumId) {\n    return <AlbumView albumId={selectedAlbumId} onBack={() => setSelectedAlbumId(null)} />;\n  }",
  ""
);

// 3. Replace setSelectedAlbumId calls
code = code.replace(
  /setSelectedAlbumId\((.*?)\)/g,
  "setActiveItem({id: $1, type: 'album'})"
);

// 4. Update AnimatePresence animations
code = code.replace(
  /initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 50 }}/g,
  'initial={{ opacity: 0, x: "100%" }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: "100%" }}'
);

// 5. Update Tab buttons
code = code.replace(
  /className={`px-4 h-10 rounded-full text-\[14px\] font-semibold border transition-colors \${[\s\S]*?}`}/g,
  (match) => {
    if (match.includes("activeSubTab === 'editorial'")) {
      return `className={\`px-5 h-10 rounded-full text-[15px] font-semibold transition-all \${activeSubTab === 'editorial' ? 'bg-black text-white dark:bg-white dark:text-black shadow-md' : 'bg-transparent text-gray-500 hover:bg-black/5 dark:hover:bg-white/5'}\`}`;
    }
    if (match.includes("activeSubTab === 'parati'")) {
      return `className={\`px-5 h-10 rounded-full text-[15px] font-semibold transition-all \${activeSubTab === 'parati' ? 'bg-black text-white dark:bg-white dark:text-black shadow-md' : 'bg-transparent text-gray-500 hover:bg-black/5 dark:hover:bg-white/5'}\`}`;
    }
    return match;
  }
);

// 6. Update Top Álbumes design
code = code.replace(
  /<span className="text-\[18px\] font-bold text-gray-800 dark:text-white w-6 text-center">[\s\S]*?<\/span>/g,
  `<div className="w-10 flex-shrink-0 flex items-center justify-start">
                            <span className="text-[32px] font-black tracking-tighter text-gray-300 dark:text-gray-700/80">
                              {globalIdx < 10 ? \`0\${globalIdx}\` : globalIdx}
                            </span>
                          </div>`
);

fs.writeFileSync('src/components/HomeTab.tsx', code);
