const fs = require('fs');
const tabs = ['SearchTab.tsx', 'LibraryTab.tsx', 'DownloadsTab.tsx', 'SettingsTab.tsx'];

for (const tab of tabs) {
  let content = fs.readFileSync('src/components/' + tab, 'utf8');
  if (!content.includes('useTabBarScroll')) {
    content = content.replace("import { useState", "import { useTabBarScroll } from '../hooks/useTabBarScroll';\nimport { useState");
    // fallback if no useState
    if (!content.includes("import { useTabBarScroll")) {
       content = "import { useTabBarScroll } from '../hooks/useTabBarScroll';\n" + content;
    }
  }
  
  if (!content.includes('const handleScroll = useTabBarScroll()')) {
    content = content.replace("export default function " + tab.split('.')[0] + "() {", "export default function " + tab.split('.')[0] + "() {\n  const handleScroll = useTabBarScroll();");
  }

  // find the first overflow-y-auto div
  content = content.replace(/className="([^"]*overflow-y-auto[^"]*)"/, 'className="$1" onScroll={handleScroll}');
  
  fs.writeFileSync('src/components/' + tab, content);
}
