const fs = require('fs');

// 1. Fix AlbumView
let album = fs.readFileSync('src/components/AlbumView.tsx', 'utf8');

const albumSearch = `  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-400 bg-[#F2F2F7] dark:bg-[#000000]">
        <Loader2 className="w-8 h-8 animate-spin mb-4 text-[#007AFF]" />
        <p>Cargando álbum...</p>
      </div>
    );
  }

  if (error || !album) {
    return (
      <div className="p-8 pt-16 h-full bg-[#F2F2F7] dark:bg-[#000000]">
        <button onClick={onBack} className="flex items-center text-[#007AFF] mb-4">
          <ChevronLeft className="w-5 h-5 mr-1" /> Volver
        </button>
        <div className="p-4 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-xl text-sm">
          <p className="font-semibold mb-1">Error</p>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="h-full w-full overflow-y-auto bg-[#F2F2F7] dark:bg-[#000000] relative">`;

const albumReplace = `  return (
    <div ref={containerRef} className="h-full w-full overflow-y-auto bg-[#F2F2F7] dark:bg-[#000000] relative">
      {loading ? (
        <div className="flex flex-col items-center justify-center min-h-[500px] h-full text-gray-400">
          <Loader2 className="w-8 h-8 animate-spin mb-4 text-[#007AFF]" />
          <p>Cargando álbum...</p>
        </div>
      ) : error || !album ? (
        <div className="p-8 pt-16 h-full">
          <button onClick={onBack} className="flex items-center text-[#007AFF] mb-4">
            <ChevronLeft className="w-5 h-5 mr-1" /> Volver
          </button>
          <div className="p-4 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-xl text-sm">
            <p className="font-semibold mb-1">Error</p>
            <p>{error}</p>
          </div>
        </div>
      ) : (
        <>`;

album = album.replace(albumSearch, albumReplace);

const albumCloseSearch = `      <AnimatePresence>
        {downloadItem && (
          <DownloadModal 
            item={downloadItem.item} 
            type={downloadItem.type} 
            onClose={() => setDownloadItem(null)} 
          />
        )}
      </AnimatePresence>
    </div>`;

const albumCloseReplace = `      <AnimatePresence>
        {downloadItem && (
          <DownloadModal 
            item={downloadItem.item} 
            type={downloadItem.type} 
            onClose={() => setDownloadItem(null)} 
          />
        )}
      </AnimatePresence>
      </>
      )}
    </div>`;

album = album.replace(albumCloseSearch, albumCloseReplace);
fs.writeFileSync('src/components/AlbumView.tsx', album);


// 2. Fix PlaylistView
let playlist = fs.readFileSync('src/components/PlaylistView.tsx', 'utf8');

const playlistSearch = `  const getPlaylistImage = () => {
    if (playlist.images300 && playlist.images300.length > 0) return playlist.images300[0];
    if (playlist.image_rectangle && playlist.image_rectangle.length > 0) return playlist.image_rectangle[0];
    return playlist.image?.large || playlist.image?.small;
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-400 bg-[#F2F2F7] dark:bg-[#000000]">
        <Loader2 className="w-8 h-8 animate-spin mb-4 text-[#007AFF]" />
        <p>Cargando playlist...</p>
      </div>
    );
  }

  if (error || !playlist) {
    return (
      <div className="p-8 pt-16 h-full bg-[#F2F2F7] dark:bg-[#000000]">
        <button onClick={onBack} className="flex items-center text-[#007AFF] mb-4">
          <ChevronLeft className="w-5 h-5 mr-1" /> Volver
        </button>
        <div className="p-4 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-xl text-sm">
          <p className="font-semibold mb-1">Error</p>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  const mainImage = getPlaylistImage();

  return (
    <div ref={containerRef} className="h-full w-full overflow-y-auto bg-[#F2F2F7] dark:bg-[#000000] relative">`;

const playlistReplace = `  const getPlaylistImage = () => {
    if (!playlist) return null;
    if (playlist.images300 && playlist.images300.length > 0) return playlist.images300[0];
    if (playlist.image_rectangle && playlist.image_rectangle.length > 0) return playlist.image_rectangle[0];
    return playlist.image?.large || playlist.image?.small;
  };

  const mainImage = getPlaylistImage();

  return (
    <div ref={containerRef} className="h-full w-full overflow-y-auto bg-[#F2F2F7] dark:bg-[#000000] relative">
      {loading ? (
        <div className="flex flex-col items-center justify-center min-h-[500px] h-full text-gray-400">
          <Loader2 className="w-8 h-8 animate-spin mb-4 text-[#007AFF]" />
          <p>Cargando playlist...</p>
        </div>
      ) : error || !playlist ? (
        <div className="p-8 pt-16 h-full">
          <button onClick={onBack} className="flex items-center text-[#007AFF] mb-4">
            <ChevronLeft className="w-5 h-5 mr-1" /> Volver
          </button>
          <div className="p-4 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-xl text-sm">
            <p className="font-semibold mb-1">Error</p>
            <p>{error}</p>
          </div>
        </div>
      ) : (
        <>`;

playlist = playlist.replace(playlistSearch, playlistReplace);
playlist = playlist.replace(albumCloseSearch, albumCloseReplace);
fs.writeFileSync('src/components/PlaylistView.tsx', playlist);
