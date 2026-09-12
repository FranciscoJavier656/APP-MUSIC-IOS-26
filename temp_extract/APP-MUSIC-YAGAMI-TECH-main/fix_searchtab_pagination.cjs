const fs = require('fs');
let code = fs.readFileSync('src/components/SearchTab.tsx', 'utf8');

code = code.replace(
  /  const executeSearch = async \(searchQuery: string, currentOffset = 0\) => \{[\s\S]*?\} catch \(err: any\) \{/,
  `  const executeSearch = async (searchQuery: string, currentOffset = 0) => {
    if (currentOffset === 0) {
      setLoading(true);
      setOffset(0);
    } else {
      setLoadingMore(true);
    }
    setError('');
    try {
      let typeParam = undefined;
      if (currentOffset > 0 && filterMode !== 'all') {
        typeParam = filterMode;
      }
      
      const data = await searchQobuz(searchQuery, 50, currentOffset, typeParam);
      if (currentOffset === 0) {
        setResults(data);
      } else {
        setResults((prev: any) => ({
          ...prev,
          tracks: {
            ...prev.tracks,
            items: [...(prev.tracks?.items || []), ...(data.tracks?.items || [])]
          },
          albums: {
            ...prev.albums,
            items: [...(prev.albums?.items || []), ...(data.albums?.items || [])]
          },
          artists: {
            ...prev.artists,
            items: [...(prev.artists?.items || []), ...(data.artists?.items || [])]
          }
        }));
      }
      
      let total = 0;
      let loaded = 0;
      if (filterMode === 'tracks') {
        total = data.tracks?.total || 0;
        loaded = currentOffset + (data.tracks?.items?.length || 0);
        setHasMore(loaded < total);
      } else if (filterMode === 'albums') {
        total = data.albums?.total || 0;
        loaded = currentOffset + (data.albums?.items?.length || 0);
        setHasMore(loaded < total);
      } else if (filterMode === 'artists') {
        total = data.artists?.total || 0;
        loaded = currentOffset + (data.artists?.items?.length || 0);
        setHasMore(loaded < total);
      } else {
        setHasMore(false); // No pagination in 'all' view
      }
      
    } catch (err: any) {`
);

fs.writeFileSync('src/components/SearchTab.tsx', code);
