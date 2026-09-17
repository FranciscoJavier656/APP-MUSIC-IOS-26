const fs = require('fs');
let code = fs.readFileSync('src/components/SearchTab.tsx', 'utf8');

code = code.replace(
  "  const handleSearch = (e: FormEvent) => {",
  "  useEffect(() => {\n    if (!results) return;\n    let total = 0;\n    let loaded = 0;\n    if (filterMode === 'tracks') {\n      total = results.tracks?.total || 0;\n      loaded = results.tracks?.items?.length || 0;\n      setHasMore(loaded < total);\n    } else if (filterMode === 'albums') {\n      total = results.albums?.total || 0;\n      loaded = results.albums?.items?.length || 0;\n      setHasMore(loaded < total);\n    } else if (filterMode === 'artists') {\n      total = results.artists?.total || 0;\n      loaded = results.artists?.items?.length || 0;\n      setHasMore(loaded < total);\n    } else {\n      setHasMore(false);\n    }\n    setOffset(loaded);\n  }, [filterMode, results]);\n\n  const handleSearch = (e: FormEvent) => {"
);

fs.writeFileSync('src/components/SearchTab.tsx', code);
