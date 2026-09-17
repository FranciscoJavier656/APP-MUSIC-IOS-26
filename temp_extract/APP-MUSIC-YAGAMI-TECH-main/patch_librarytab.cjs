const fs = require('fs');

let code = fs.readFileSync('src/components/LibraryTab.tsx', 'utf8');

// Imports
code = code.replace(
  "import { getUserFavorites, getUserPlaylists } from '../lib/qobuz';",
  "import { getUserFavorites, getUserPlaylists } from '../lib/qobuz';\nimport { useIntersectionObserver } from '../hooks/useIntersectionObserver';"
);

// State and observer
code = code.replace(
  "const [isLoading, setIsLoading] = useState(true);",
  "const [isLoading, setIsLoading] = useState(true);\n  const [loadingMore, setLoadingMore] = useState(false);\n  const [hasMoreStreaming, setHasMoreStreaming] = useState(true);\n  const [offset, setOffset] = useState(0);\n  const { targetRef, isIntersecting } = useIntersectionObserver({ threshold: 0.1 });"
);

// Effect to reset offset when mode/tab changes
code = code.replace(
  "useEffect(() => {\n    loadData();",
  "useEffect(() => {\n    setOffset(0);\n    setHasMoreStreaming(true);\n    loadData(0);\n"
);

// Adjust loadData to take an offset
code = code.replace(
  "const loadData = async () => {\n    setIsLoading(true);\n    if (libraryMode === 'streaming') {\n      try {\n        if (activeTab === 'playlists') {\n          const res = await getUserPlaylists(50, 0);\n          setStreamingData(res?.playlists?.items || []);\n        } else {\n          const res = await getUserFavorites(activeTab, 50, 0);\n          setStreamingData(res?.[activeTab]?.items || []);\n        }\n      } catch (e) {",
  `const loadData = async (currentOffset = 0) => {
    setIsLoading(true);
    if (libraryMode === 'streaming') {
      try {
        if (activeTab === 'playlists') {
          const res = await getUserPlaylists(50, currentOffset);
          const items = res?.playlists?.items || [];
          setStreamingData(currentOffset === 0 ? items : prev => [...prev, ...items]);
          setHasMoreStreaming(items.length === 50);
        } else {
          const res = await getUserFavorites(activeTab, 50, currentOffset);
          const items = res?.[activeTab]?.items || [];
          setStreamingData(currentOffset === 0 ? items : prev => [...prev, ...items]);
          setHasMoreStreaming(items.length === 50);
        }
      } catch (e) {`
);

// Add loadMore logic
const loadMoreFn = `
  useEffect(() => {
    if (libraryMode === 'streaming' && isIntersecting && hasMoreStreaming && !isLoading && !loadingMore && !(selectedAlbum || selectedArtist)) {
      setLoadingMore(true);
      const nextOffset = offset + 50;
      setOffset(nextOffset);
      
      const fetchMore = async () => {
        try {
          if (activeTab === 'playlists') {
            const res = await getUserPlaylists(50, nextOffset);
            const items = res?.playlists?.items || [];
            setStreamingData(prev => [...prev, ...items]);
            setHasMoreStreaming(items.length === 50);
          } else {
            const res = await getUserFavorites(activeTab, 50, nextOffset);
            const items = res?.[activeTab]?.items || [];
            setStreamingData(prev => [...prev, ...items]);
            setHasMoreStreaming(items.length === 50);
          }
        } catch (e) {
          console.error(e);
        } finally {
          setLoadingMore(false);
        }
      };
      
      fetchMore();
    }
  }, [isIntersecting, hasMoreStreaming, isLoading, loadingMore, libraryMode, activeTab, offset, selectedAlbum, selectedArtist]);
`;

code = code.replace(
  "const handleFilterToggle = () => {",
  `${loadMoreFn}\n  const handleFilterToggle = () => {`
);

// Add the targetRef to the list
code = code.replace(
  "            {items.map((item, idx) => (",
  `            {items.map((item, idx) => (`
); // No change, just finding insertion point

code = code.replace(
  "              </div>\n            ))}\n          </div>\n        )}\n      </motion.div>",
  `              </div>
            ))}
            {libraryMode === 'streaming' && hasMoreStreaming && (
              <div ref={targetRef} className="py-6 flex justify-center">
                <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
              </div>
            )}
          </div>
        )}
      </motion.div>`
);

fs.writeFileSync('src/components/LibraryTab.tsx', code);
