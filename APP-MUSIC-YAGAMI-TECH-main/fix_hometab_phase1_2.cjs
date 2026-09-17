const fs = require('fs');
let code = fs.readFileSync('src/components/HomeTab.tsx', 'utf8');

// Upgrade renderSectionHeader typography
code = code.replace(
  'const renderSectionHeader = (title: string, subtitle?: string) => (\n    <div className="px-4 mb-4 mt-10">\n      <div className="flex justify-between items-end">\n        <div>\n          <h2 className="text-[22px] font-bold tracking-tight text-black dark:text-white leading-tight">{title}</h2>\n          {subtitle && <p className="text-[14px] text-gray-500 dark:text-gray-400 mt-1">{subtitle}</p>}\n        </div>\n        \n      </div>\n    </div>\n  );',
  `const renderSectionHeader = (title: string, subtitle?: string) => (
    <div className="px-5 mb-5 mt-12">
      <div className="flex justify-between items-end">
        <div className="max-w-[85%]">
          <h2 className="text-3xl font-black tracking-tighter text-black dark:text-white leading-tight">{title}</h2>
          {subtitle && <p className="text-[15px] font-medium text-gray-500 dark:text-gray-400 mt-1.5 leading-snug">{subtitle}</p>}
        </div>
      </div>
    </div>
  );`
);

// Replace generic px-4 with px-5 in the scrollable containers
code = code.replace(/className="flex overflow-x-auto pb-6 px-4 gap-4 no-scrollbar"/g, 'className="flex overflow-x-auto pb-8 px-5 gap-5 no-scrollbar"');
code = code.replace(/className="px-4 pb-6 flex gap-4 overflow-x-auto no-scrollbar"/g, 'className="flex overflow-x-auto pb-8 px-5 gap-5 no-scrollbar"');

// Increase width of Novedades items
code = code.replace(/className="flex-none w-\[160px\] cursor-pointer group"/g, 'className="flex-none w-[180px] cursor-pointer group"');
code = code.replace(/className="flex-none w-\[140px\]/g, 'className="flex-none w-[160px]');

// Give "Álbum de la semana" badge a better look
code = code.replace(
  '<div className="absolute bottom-2 left-2 bg-[#E15328] text-white text-[10px] font-bold px-1.5 py-0.5 rounded shadow-sm flex items-center gap-1 uppercase">',
  '<div className="absolute bottom-3 left-3 bg-[#E15328]/90 backdrop-blur-md text-white text-[10px] font-black tracking-wider px-2 py-1 rounded shadow-lg flex items-center gap-1 uppercase">'
);

// Better Top Albums images (rounding)
code = code.replace(/className="relative w-\[70px\] h-\[70px\] rounded overflow-hidden shrink-0"/g, 'className="relative w-[70px] h-[70px] rounded-lg shadow-sm overflow-hidden shrink-0"');

// Clean up tabs sticky header padding
code = code.replace(
  '<div className="pt-14 pb-4 px-4 sticky top-0 bg-[#F2F2F7]/95 dark:bg-[#000000]/95 backdrop-blur-xl z-10">',
  '<div className="pt-14 pb-4 px-5 sticky top-0 bg-[#F2F2F7]/90 dark:bg-[#000000]/90 backdrop-blur-2xl z-10 border-b border-black/5 dark:border-white/5">'
);

fs.writeFileSync('src/components/HomeTab.tsx', code);
