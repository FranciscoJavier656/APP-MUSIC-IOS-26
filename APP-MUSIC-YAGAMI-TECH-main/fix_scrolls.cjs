const fs = require('fs');

// Fix SearchTab
let search = fs.readFileSync('src/components/SearchTab.tsx', 'utf8');
search = search.replace('<div className="flex flex-col min-h-full pb-[180px] overflow-y-auto">', '<div className="flex flex-col h-full pb-[180px] overflow-y-auto">');
fs.writeFileSync('src/components/SearchTab.tsx', search);

// Fix SettingsTab
let settings = fs.readFileSync('src/components/SettingsTab.tsx', 'utf8');
settings = settings.replace('<div className="flex flex-col min-h-full">', '<div className="flex flex-col h-full w-full bg-[#F2F2F7] dark:bg-[#000000]">');
settings = settings.replace('<div className="flex-1 px-8 pb-8 overflow-y-auto space-y-8">', '<div className="flex-1 px-8 pb-[180px] overflow-y-auto space-y-8">');
fs.writeFileSync('src/components/SettingsTab.tsx', settings);

console.log("Scrolls fixed");
