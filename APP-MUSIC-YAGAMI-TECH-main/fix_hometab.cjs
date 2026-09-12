const fs = require('fs');

let code = fs.readFileSync('src/components/HomeTab.tsx', 'utf8');

// Add import for ParaTiSection
code = code.replace(
  "import PlaylistView from './PlaylistView';",
  "import PlaylistView from './PlaylistView';\nimport ParaTiSection from './ParaTiSection';"
);

// Add condition for render
const searchRender = `        <div className="pb-8">
          {activeSubTab === 'editorial' ? (
            <div className="h-full">
              {/* Novedades / Álbumes de la semana */}`;

const replaceRender = `        <div className="pb-8">
          {activeSubTab === 'parati' ? (
            <ParaTiSection 
              editorPicks={editorPicks} 
              playlists={playlists} 
              onItemClick={(id, type) => setActiveItem({id, type})} 
            />
          ) : activeSubTab === 'editorial' ? (
            <div className="h-full">
              {/* Carrusel de Píldoras Editoriales */}
              <div className="flex overflow-x-auto px-5 py-4 gap-2 no-scrollbar border-b border-black/5 dark:border-white/5 mb-2">
                {['Lanzamientos', 'Audio Hi-Res', 'Pop', 'Jazz', 'Clásica', 'Electrónica', 'Relajación'].map((tag, idx) => (
                  <button key={tag} className={\`px-4 py-1.5 rounded-full text-[13px] font-bold whitespace-nowrap \${idx === 0 ? 'bg-black text-white dark:bg-white dark:text-black' : 'bg-black/5 dark:bg-white/10 text-gray-700 dark:text-gray-300'}\`}>
                    {tag}
                  </button>
                ))}
              </div>
              
              {/* Novedades / Álbumes de la semana */}`;

code = code.replace(searchRender, replaceRender);

fs.writeFileSync('src/components/HomeTab.tsx', code);
