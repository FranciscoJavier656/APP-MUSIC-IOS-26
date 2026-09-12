  const handleDownload = async () => {
    if (type === 'album') {
      setStatus('downloading');
      try {
        const url = `/api/downloadAlbumZip?album_id=${item.id}&format_id=${format}`;
        const a = document.createElement('a');
        a.href = url;
        a.download = `${item.title || 'Album'}.zip`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        
        setStatus('done');
      } catch (error) {
        console.error(error);
        setStatus('error');
      }
      return;
    }

    setStatus('fetching');
    try {
      const tracksToDownload = [item];
      setProgress({ current: 0, total: tracksToDownload.length });
      setStatus('downloading');

      for (let i = 0; i < tracksToDownload.length; i++) {
        const track = tracksToDownload[i];
        try {
          const url = `/api/downloadWithMetadata?track_id=${track.id}&format_id=${format}`;
          const a = document.createElement('a');
          a.href = url;
          a.download = `${track.title || 'Track'}.mp3`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
        } catch (e) {
          console.error("Failed to trigger download for track", track.id);
        }
        setProgress(p => ({ ...p, current: i + 1 }));
      }
      setStatus('done');
    } catch (error) {
      console.error(error);
      setStatus('error');
    }
  };
