#!/usr/bin/perl
use strict;
use warnings;

my $file = 'ios/App/App/SceneDelegate.swift';
open my $in, '<', $file or die $!;
my $content = do { local $/; <$in> };
close $in;

# Remove the invalid extension
$content =~ s/\/\/ MARK: - Magic Transparency Hack\n\/\/ This makes the native UITabBarController completely transparent behind the tab bar,\n\/\/ allowing our ZStack background \(the Capacitor WebView\) to shine through on ALL tabs\.\nextension UITabBarController \{\n    override open func viewDidLoad\(\) \{\n        super\.viewDidLoad\(\)\n        self\.view\.backgroundColor = \.clear\n    \}\n\}\n\n// MARK: - Hybrid Root View & Components/\/\/ MARK: - Magic Transparency Hack\n\nstruct TabViewBackgroundClearer: UIViewControllerRepresentable {\n    func makeUIViewController(context: Context) -> UIViewController {\n        let vc = UIViewController()\n        vc.view.backgroundColor = .clear\n        DispatchQueue.main.async {\n            var parent = vc.parent\n            while let currentParent = parent {\n                if let tabBarController = currentParent as? UITabBarController {\n                    tabBarController.view.backgroundColor = .clear\n                    break\n                }\n                parent = currentParent.parent\n            }\n        }\n        return vc\n    }\n    \n    func updateUIViewController(_ uiViewController: UIViewController, context: Context) {}\n}\n\n\/\/ MARK: - Hybrid Root View & Components/g;

# Add TabViewBackgroundClearer to the first Color.clear
$content =~ s/Color\.clear\n                    \.allowsHitTesting\(false\)\n                    \.tag\("home"\)/Color.clear\n                    .background(TabViewBackgroundClearer())\n                    .allowsHitTesting(false)\n                    .tag("home")/g;

open my $out, '>', $file or die $!;
print $out $content;
close $out;
