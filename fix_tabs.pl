#!/usr/bin/perl
undef $/;
$_ = <>;

if ($ARGV[0] =~ /DownloadsTab/) {
    s/export default function HomeTab\(\) \{\n  const handleScroll = useTabBarScroll\(\);/export default function DownloadsTab() {\n  const handleScroll = useTabBarScroll();/s;
} elsif ($ARGV[0] =~ /LibraryTab/) {
    s/export default function HomeTab\(\) \{\n  const handleScroll = useTabBarScroll\(\);/export default function LibraryTab() {\n  const handleScroll = useTabBarScroll();/s;
} elsif ($ARGV[0] =~ /SearchTab/) {
    s/export default function HomeTab\(\) \{\n  const handleScroll = useTabBarScroll\(\);/export default function SearchTab() {\n  const handleScroll = useTabBarScroll();/s;
} elsif ($ARGV[0] =~ /SettingsTab/) {
    s/export default function HomeTab\(\) \{\n  const handleScroll = useTabBarScroll\(\); isDarkMode, setIsDarkMode \}: SettingsTabProps\) \{/export default function SettingsTab({ isDarkMode, setIsDarkMode }: SettingsTabProps) {\n  const handleScroll = useTabBarScroll();/s;
}

print;
