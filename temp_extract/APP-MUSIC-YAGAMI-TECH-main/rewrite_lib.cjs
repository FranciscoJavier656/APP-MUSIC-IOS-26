const fs = require('fs');
let code = fs.readFileSync('src/components/LibraryTab.tsx', 'utf8');

const splitToken = '  const renderEmptyState = () => {';
const parts = code.split(splitToken);

if (parts.length === 2) {
  const newBottom = `  const renderEmptyState = () => {
    const activeTabInfo = tabs.find(t => t.id === activeTab);
    const IconComponent = activeTabInfo?.icon || Music;
    
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 mt-10">
        <div className="w-24 h-24 mb-6 relative">
          <div className="absolute inset-0 bg-[#007AFF]/10 rounded-full blur-2xl" />
          <div className="relative w-full h-full rounded-full bg-gray-200 dark:bg-gray-800 flex items-center justify-center shadow-sm">
            <IconComponent className="w-10 h-10 text-gray-400" />
          </div>
        </div>
        <h3 className="text-xl font-black tracking-tighter text-black dark:text-white mb-2 text-center">
          No hay {activeTabInfo?.title.toLowerCase()}
        </h3>
        <p className="text-gray-500 text-[15px] font-medium text-center mb-6 max-w-[250px]">
          Explora música y añade tus {activeTabInfo?.title.toLowerCase()} favoritos a la biblioteca.
        </p>
        <button 
           className="px-6 py-3 bg-[#007AFF] text-white rounded-full font-bold shadow-md hover:scale-105 active:scale-95 transition-transform flex items-center gap-2"
           onClick={() => document.dispatchEvent(new CustomEvent('navigate', {detail: 'search'}))}
        >
          <Search className="w-5 h-5" />
          <span>Explorar música</span>
        </button>
      </div>
    );
  };

  return (
    <div className="h-full w-full overflow-y-auto bg-[#F2F2F7] dark:bg-[#000000] pb-[180px]">
      <div className="pt-12 px-6 pb-2">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-black tracking-tighter text-black dark:text-white">Biblioteca</h1>
          <button 
             onClick={handleFilterToggle}
             disabled={activeTab !== 'favorites'}
             className={\`w-10 h-10 rounded-full flex items-center justify-center transition-colors \${activeTab !== 'favorites' ? 'opacity-50' : 'bg-gray-200 dark:bg-[#1C1C1E] text-[#007AFF]'}\`}
           >
             <Filter size={20} className={favoriteFilter === 'local' ? 'text-[#FFB800]' : 'text-[#007AFF]'} />
           </button>
        </div>
        <p className="text-[13px] text-gray-500 font-medium mt-1">
          {items.length} {items.length === 1 ? 'elemento' : 'elementos'}
          {activeTab === 'favorites' && (
             <span className={favoriteFilter === 'local' ? 'text-[#FFB800]' : 'text-[#007AFF]'}>
               {' '}• {favoriteFilter === 'local' ? 'Descargados' : 'Streaming'}
             </span>
          )}
        </p>
      </div>

      <div className="px-6 mb-4">
        <div className="flex gap-2 overflow-x-auto no-scrollbar py-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => { setActiveTab(tab.id as any); setSelectedAlbum(null); setSelectedArtist(null); }}
                className={\`flex items-center gap-2 px-4 py-2 rounded-full text-[13px] font-bold transition-all \${
                  isActive 
                    ? 'bg-black text-white dark:bg-white dark:text-black shadow-md' 
                    : 'bg-gray-200 text-gray-600 dark:bg-[#1C1C1E] dark:text-gray-400 hover:bg-gray-300 dark:hover:bg-gray-800'
                }\`}
              >
                <Icon size={16} />
                <span>{tab.title}</span>
              </button>
            );
          })}
        </div>
      </div>

      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex-1 flex flex-col"
      >
        {(selectedAlbum || selectedArtist) ? renderDrillDown() : items.length === 0 ? (
          renderEmptyState()
        ) : (
          <div className="px-4 space-y-1">
            {items.map((item, idx) => (
              <div key={item.id || idx} className="flex items-center space-x-3 p-2 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer group">
                <div 
                  className={\`w-14 h-14 bg-gray-200 dark:bg-gray-800 \${item.type === 'artist' ? 'rounded-full' : 'rounded-lg'} overflow-hidden flex-shrink-0 relative\`}
                  onClick={() => {
                    if (item.type === 'album') setSelectedAlbum(item);
                    if (item.type === 'artist') setSelectedArtist(item);
                  }}
                >
                  <OfflineImage 
                    localPath={item.localCoverPath || item.original?.localCoverPath} 
                    remoteUrl={getImageSrc(item.image) || getImageSrc(item.original?.album?.image || item.original?.image)} 
                    alt={item.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute bottom-1 right-1 bg-black/60 backdrop-blur-md rounded-full p-1 border border-white/10">
                    {item.type === 'artist' ? <User size={8} className="text-white" /> :
                     item.type === 'album' ? <Disc size={8} className="text-white" /> :
                     <Music size={8} className="text-white" />}
                  </div>
                </div>
                <div 
                  className="flex-1 min-w-0" 
                  onClick={() => {
                    if (item.type === 'album') setSelectedAlbum(item);
                    if (item.type === 'artist') setSelectedArtist(item);
                  }}
                >
                  <p className="font-bold text-[15px] leading-tight truncate text-black dark:text-white">{item.title}</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    {item.trackCount && <span className="text-gray-500 text-[13px]">{item.trackCount} pistas • </span>}
                    <p className="text-gray-500 text-[13px] truncate font-medium">{item.subtitle}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-1">
                  {(item.type === 'track' || activeTab === 'favorites') && (
                    <button 
                      onClick={(e) => {
                         e.stopPropagation();
                         const trackToPlay = { 
                           ...item.original, 
                           localPath: item.original.localPath || item.localPath 
                         };
                         const queueToPlay = (activeTab === 'favorites' ? offlineTracks : items.filter((i: any) => i.type === 'track' || i.original)).map((i: any) => ({
                           ...(i.original || i),
                           localPath: (i.original && i.original.localPath) || i.localPath
                         }));
                         playTrack(trackToPlay, queueToPlay);
                      }}
                      className="w-10 h-10 flex items-center justify-center bg-[#007AFF]/10 text-[#007AFF] hover:bg-[#007AFF] hover:text-white rounded-full transition-colors"
                    >
                      <Play className="w-5 h-5 fill-current ml-0.5" />
                    </button>
                  )}
                  {item.type === 'track' && (
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        removeTrack(item.id);
                      }}
                      className="w-10 h-10 flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-500/10 rounded-full transition-colors"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}
`;
  fs.writeFileSync('src/components/LibraryTab.tsx', parts[0] + newBottom);
  console.log("Rewrote LibraryTab");
} else {
  console.log("Could not split!");
}
