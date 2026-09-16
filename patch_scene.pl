#!/usr/bin/perl
use strict;
use warnings;

my $file = 'ios/App/App/SceneDelegate.swift';
open my $in, '<', $file or die "Cannot open $file: $!";
my $content = do { local $/; <$in> };
close $in;

# Replace HybridRootView
my $new_hybrid = <<'END_HYBRID';
@available(iOS 18.0, *)
struct HybridRootView: View {
    let bridgeVC: CAPBridgeViewController
    
    @State private var selectedTab = "home"
    @State private var showAlbumZoom = false
    @Namespace private var zoomNamespace
    
    var body: some View {
        ZStack(alignment: .bottom) {
            // 1. The WebView is ALWAYS active in the background
            CapacitorBridgeView(bridgeVC: bridgeVC)
                .ignoresSafeArea()
            
            // 2. Custom Native Tab Bar overlay
            NativeTabBarOverlay(selectedTab: $selectedTab)
        }
        .onChange(of: selectedTab) { newValue in
            // Sync native selection to React without jumping back!
            bridgeVC.webView?.evaluateJavaScript("window.dispatchEvent(new CustomEvent('navigate', {detail: '\(newValue)'}))")
        }
        .sheet(isPresented: $showAlbumZoom) {
            NativeAlbumDetailView()
                .presentationDetents([.height(180), .medium, .large]) // WWDC
                .presentationBackground(.thickMaterial) // WWDC
        }
        .onReceive(NotificationCenter.default.publisher(for: NSNotification.Name("OpenNativeZoom"))) { _ in
            showAlbumZoom = true
        }
    }
}

// MARK: - Native Tab Bar Overlay

@available(iOS 18.0, *)
struct NativeTabBarOverlay: View {
    @Binding var selectedTab: String
    
    var body: some View {
        VStack(spacing: 0) {
            Divider()
            HStack(alignment: .bottom) {
                TabBarButton(id: "home", icon: "house", title: "Inicio", selectedTab: $selectedTab)
                Spacer()
                TabBarButton(id: "search", icon: "magnifyingglass", title: "Buscar", selectedTab: $selectedTab)
                Spacer()
                TabBarButton(id: "library", icon: "square.stack.fill", title: "Librería", selectedTab: $selectedTab)
                Spacer()
                TabBarButton(id: "downloads", icon: "arrow.down.circle", title: "Descargas", selectedTab: $selectedTab)
                Spacer()
                TabBarButton(id: "settings", icon: "gearshape", title: "Ajustes", selectedTab: $selectedTab)
            }
            .padding(.horizontal, 28)
            .padding(.top, 8)
            .padding(.bottom, 4)
        }
        // This extends the beautiful Apple blur into the bottom screen edge (home indicator area)
        .background(.bar, ignoresSafeAreaEdges: .bottom)
    }
}

@available(iOS 18.0, *)
struct TabBarButton: View {
    let id: String
    let icon: String
    let title: String
    @Binding var selectedTab: String
    
    var body: some View {
        Button {
            selectedTab = id
        } label: {
            VStack(spacing: 4) {
                Image(systemName: selectedTab == id ? icon + ".fill" : icon)
                    .font(.system(size: 20, weight: .medium))
                Text(title)
                    .font(.system(size: 10, weight: .medium))
            }
            .foregroundColor(selectedTab == id ? .accentColor : .secondary)
            .frame(maxWidth: .infinity)
        }
    }
}
END_HYBRID

$content =~ s/\@available\(iOS 18\.0, \*\)\nstruct HybridRootView: View \{.*?(?=\/\/ MARK: - Native Components requested from WWDC)/$new_hybrid\n\n/s;

open my $out, '>', $file or die "Cannot write $file: $!";
print $out $content;
close $out;
