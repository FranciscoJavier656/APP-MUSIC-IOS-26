const fs = require('fs');
let code = fs.readFileSync('src/components/HomeTab.tsx', 'utf8');

// 1. Add state for activeCategory
code = code.replace(
  "const [activeSubTab, setActiveSubTab] = useState('editorial');",
  "const [activeSubTab, setActiveSubTab] = useState('editorial');\n  const [activeCategory, setActiveCategory] = useState('Lanzamientos');"
);

// 2. Fix SlidersHorizontal button to navigate to settings
code = code.replace(
  /<button className="w-10 h-10 rounded-full flex items-center justify-center text-gray-500 hover:text-black dark:hover:text-white transition-colors">\s*<SlidersHorizontal size={20} strokeWidth={2.5} \/>\s*<\/button>/g,
  `<button onClick={() => document.dispatchEvent(new CustomEvent('navigate', {detail: 'settings'}))} className="w-10 h-10 rounded-full flex items-center justify-center text-gray-500 hover:text-black dark:hover:text-white transition-colors">
          <SlidersHorizontal size={20} strokeWidth={2.5} />
        </button>`
);

// 3. Fix Editorial Pills to use activeCategory
code = code.replace(
  /\{idx === 0 \? 'bg-black text-white dark:bg-white dark:text-black' : 'bg-black\/5 dark:bg-white\/10 text-gray-700 dark:text-gray-300'\}/g,
  "{activeCategory === tag ? 'bg-black text-white dark:bg-white dark:text-black' : 'bg-black/5 dark:bg-white/10 text-gray-700 dark:text-gray-300'}"
);
code = code.replace(
  /<button key=\{tag\} className=\{`/g,
  "<button key={tag} onClick={() => setActiveCategory(tag)} className={`"
);

fs.writeFileSync('src/components/HomeTab.tsx', code);
