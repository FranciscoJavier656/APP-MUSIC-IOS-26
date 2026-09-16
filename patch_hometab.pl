#!/usr/bin/perl
undef $/;
$_ = <>;

s/import \{ getImageSrc \} from '\.\.\/lib\/image';/import \{ getImageSrc \} from '..\/lib\/image';\nimport \{ useTabBarScroll \} from '..\/hooks\/useTabBarScroll';/s;

s/export default func.*?\{/export default function HomeTab() {\n  const handleScroll = useTabBarScroll();/s;

s/<div className="h-full w-full bg-\[\#F2F2F7\] dark:bg-\[\#000000\] text-black dark:text-white transition-colors duration-300 overflow-y-auto pb-\[180px\]">/<div className="h-full w-full bg-[#F2F2F7] dark:bg-[#000000] text-black dark:text-white transition-colors duration-300 overflow-y-auto pb-[180px]" onScroll={handleScroll}>/s;

print;
