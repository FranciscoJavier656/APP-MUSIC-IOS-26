const fs = require('fs');
let code = fs.readFileSync('src/components/HomeTab.tsx', 'utf8');

const newCode = `
  const [categoryLoading, setCategoryLoading] = useState(false);

  useEffect(() => {
    const fetchPlaylists = async () => {
      try {
        const res = await getFeaturedPlaylists();
        setPlaylists(res?.playlists?.items || []);
      } catch (e) {
        console.error(e);
      }
    };
    fetchPlaylists();
  }, []);

  useEffect(() => {
    const fetchHomeData = async () => {
      if (editorPicks.length === 0) setLoading(true);
      else setCategoryLoading(true);

      let genreId: string | undefined = undefined;
      let limit = 15;
      
      if (activeCategory === 'Pop') genreId = '127';
      else if (activeCategory === 'Jazz') genreId = '80';
      else if (activeCategory === 'Clásica') genreId = '10';
      else if (activeCategory === 'Electrónica') genreId = '14';
      else if (activeCategory === 'Relajación') genreId = '94'; // World/New Age equivalent

      if (activeCategory === 'Audio Hi-Res') {
        limit = 50;
      }

      try {
        const [resEditor, resStreamed] = await Promise.all([
          getFeaturedAlbums('editor-picks', genreId, limit),
          getFeaturedAlbums('most-streamed', genreId, limit)
        ]);
        
        let ep = resEditor?.albums?.items || [];
        let ms = resStreamed?.albums?.items || [];

        if (activeCategory === 'Audio Hi-Res') {
          ep = ep.filter(a => a.hires);
          ms = ms.filter(a => a.hires);
        }

        setEditorPicks(ep);
        setMostStreamed(ms);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
        setCategoryLoading(false);
      }
    };
    fetchHomeData();
  }, [activeCategory]);
`;

code = code.replace(
  /useEffect\(\(\) => \{\s*const fetchHomeData = async \(\) => \{[\s\S]*?fetchHomeData\(\);\s*\}, \[\]\);/m,
  newCode
);

fs.writeFileSync('src/components/HomeTab.tsx', code);
