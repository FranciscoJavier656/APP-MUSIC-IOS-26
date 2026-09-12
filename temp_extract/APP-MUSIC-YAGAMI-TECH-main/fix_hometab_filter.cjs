const fs = require('fs');
let code = fs.readFileSync('src/components/HomeTab.tsx', 'utf8');

code = code.replace(
  "import { Loader2, Disc, Play, Heart, ChevronRight, Home as HomeIcon } from 'lucide-react';",
  "import { Loader2, Disc, Play, Heart, ChevronRight, Home as HomeIcon, SlidersHorizontal } from 'lucide-react';"
);

code = code.replace(
  '<div className="flex items-center gap-3">',
  '<div className="flex items-center justify-between w-full">\n        <div className="flex items-center gap-3">'
);

code = code.replace(
  '          </button>\n        </div>\n      </div>',
  '          </button>\n        </div>\n        <button className="w-10 h-10 rounded-full flex items-center justify-center text-gray-500 hover:text-black dark:hover:text-white transition-colors">\n          <SlidersHorizontal size={20} strokeWidth={2.5} />\n        </button>\n      </div>\n      </div>'
);

fs.writeFileSync('src/components/HomeTab.tsx', code);
