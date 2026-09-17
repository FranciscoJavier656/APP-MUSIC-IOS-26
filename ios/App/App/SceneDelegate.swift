import UIKit
import Capacitor
import SwiftUI
import WebKit

// MARK: - Capacitor WebView Bridge
struct CapacitorBridgeView: UIViewControllerRepresentable {
    let bridgeVC: CAPBridgeViewController
    
    func makeUIViewController(context: Context) -> CAPBridgeViewController {
        return bridgeVC
    }
    
    func updateUIViewController(_ uiViewController: CAPBridgeViewController, context: Context) {}
}

// MARK: - Tab Identifiers
enum AppTab: String, CaseIterable, Identifiable {
    case home = "home"
    case search = "search"
    case library = "library"
    case downloads = "downloads"
    case settings = "settings"
    
    var id: String { rawValue }
    
    var title: String {
        switch self {
        case .home: return "Inicio"
        case .search: return "Buscar"
        case .library: return "Librería"
        case .downloads: return "Descargas"
        case .settings: return "Ajustes"
        }
    }
    
    var systemImage: String {
        switch self {
        case .home: return "house"
        case .search: return "magnifyingglass"
        case .library: return "square.stack.fill"
        case .downloads: return "arrow.down.circle"
        case .settings: return "gearshape"
        }
    }
}

// MARK: - iOS 26 Native TabView with Liquid Glass (WWDC 2025)
@available(iOS 26, *)
struct HybridRootView: View {
    let bridgeVC: CAPBridgeViewController
    
    @State private var selectedTab: AppTab = .home
    @State private var isTabBarHidden = true
    @State private var showAlbumZoom = false
    @State private var downloadBadgeCount = 0
    
    // Track info from WebView for the bottom accessory
    @State private var currentTrackTitle = ""
    @State private var currentTrackArtist = ""
    @State private var isPlaying = false
    @State private var hasTrack = false
    
    var body: some View {
        TabView(selection: $selectedTab) {
            // ── Home Tab ──
            Tab(AppTab.home.title, systemImage: AppTab.home.systemImage, value: .home) {
                CapacitorBridgeView(bridgeVC: bridgeVC)
                    .ignoresSafeArea()
                    .toolbarVisibility(isTabBarHidden ? .hidden : .visible, for: .tabBar)
            }
            
            // ── Search Tab (native search role from WWDC 2025) ──
            Tab(value: .search, role: .search) {
                CapacitorBridgeView(bridgeVC: bridgeVC)
                    .ignoresSafeArea()
                    .toolbarVisibility(isTabBarHidden ? .hidden : .visible, for: .tabBar)
            }
            
            // ── Library Tab ──
            Tab(AppTab.library.title, systemImage: AppTab.library.systemImage, value: .library) {
                CapacitorBridgeView(bridgeVC: bridgeVC)
                    .ignoresSafeArea()
                    .toolbarVisibility(isTabBarHidden ? .hidden : .visible, for: .tabBar)
            }
            
            // ── Downloads Tab ──
            Tab(AppTab.downloads.title, systemImage: AppTab.downloads.systemImage, value: .downloads) {
                CapacitorBridgeView(bridgeVC: bridgeVC)
                    .ignoresSafeArea()
                    .toolbarVisibility(isTabBarHidden ? .hidden : .visible, for: .tabBar)
            }
            
            // ── Settings Tab ──
            Tab(AppTab.settings.title, systemImage: AppTab.settings.systemImage, value: .settings) {
                CapacitorBridgeView(bridgeVC: bridgeVC)
                    .ignoresSafeArea()
                    .toolbarVisibility(isTabBarHidden ? .hidden : .visible, for: .tabBar)
            }
        }
        // ── Minimize tab bar on scroll (WWDC 2025: 5:07) ──
        .tabBarMinimizeBehavior(.onScrollDown)
        // ── Tab bar accessory for mini player (WWDC 2025: 5:39) ──
        .tabViewBottomAccessory {
            if hasTrack {
                MusicPlaybackAccessory(
                    trackTitle: currentTrackTitle,
                    artistName: currentTrackArtist,
                    isPlaying: isPlaying,
                    onPlayPause: {
                        bridgeVC.webView?.evaluateJavaScript(
                            "document.dispatchEvent(new CustomEvent('native-toggle-play'))"
                        )
                    },
                    onTap: {
                        bridgeVC.webView?.evaluateJavaScript(
                            "document.dispatchEvent(new CustomEvent('native-expand-player'))"
                        )
                    }
                )
            }
        }
        .onChange(of: selectedTab) { oldValue, newValue in
            // Sync native tab selection → React WebView
            bridgeVC.webView?.evaluateJavaScript(
                "window.dispatchEvent(new CustomEvent('navigate', {detail: '\(newValue.rawValue)'}))"
            )
        }
        // ── Sheets with presentation detents (WWDC 2025: 6:20) ──
        .sheet(isPresented: $showAlbumZoom) {
            NativeAlbumDetailView()
                .presentationDetents([.height(180), .medium, .large])
                // ── Presentation background (WWDC 2025: 6:53) ──
                .presentationBackground(.thickMaterial)
        }
        // ── Notification listeners for WebView ↔ Native sync ──
        .onReceive(NotificationCenter.default.publisher(for: NSNotification.Name("ToggleTabBar"))) { notification in
            if let hidden = notification.userInfo?["hidden"] as? Bool {
                withAnimation(.spring(response: 0.4, dampingFraction: 0.8)) {
                    isTabBarHidden = hidden
                }
            }
        }
        .onReceive(NotificationCenter.default.publisher(for: NSNotification.Name("OpenNativeZoom"))) { _ in
            showAlbumZoom = true
        }
        .onReceive(NotificationCenter.default.publisher(for: NSNotification.Name("UpdateNowPlaying"))) { notification in
            if let info = notification.userInfo {
                currentTrackTitle = info["title"] as? String ?? ""
                currentTrackArtist = info["artist"] as? String ?? ""
                isPlaying = info["isPlaying"] as? Bool ?? false
                hasTrack = info["hasTrack"] as? Bool ?? false
            }
        }
        .onReceive(NotificationCenter.default.publisher(for: NSNotification.Name("UpdateDownloadBadge"))) { notification in
            if let count = notification.userInfo?["count"] as? Int {
                downloadBadgeCount = count
            }
        }
        .onReceive(NotificationCenter.default.publisher(for: NSNotification.Name("SelectTab"))) { notification in
            if let tabId = notification.userInfo?["tabId"] as? String,
               let tab = AppTab(rawValue: tabId) {
                selectedTab = tab
            }
        }
    }
}

// MARK: - Music Playback Bottom Accessory (WWDC 2025: 5:39)
// Uses @Environment(\.tabViewBottomAccessoryPlacement) for adaptive layout
@available(iOS 26, *)
struct MusicPlaybackAccessory: View {
    let trackTitle: String
    let artistName: String
    let isPlaying: Bool
    let onPlayPause: () -> Void
    let onTap: () -> Void
    
    @Environment(\.tabViewBottomAccessoryPlacement) var placement
    
    var body: some View {
        if placement == .inline {
            // ── Compact layout (when tab bar is minimized) ──
            HStack(spacing: 8) {
                Image(systemName: "music.note")
                    .font(.caption)
                    .foregroundStyle(.secondary)
                
                Text(trackTitle)
                    .font(.caption)
                    .fontWeight(.semibold)
                    .lineLimit(1)
                
                Spacer()
                
                Button(action: onPlayPause) {
                    Image(systemName: isPlaying ? "pause.fill" : "play.fill")
                        .font(.caption)
                }
            }
            .contentShape(Rectangle())
            .onTapGesture(perform: onTap)
        } else {
            // ── Full layout (above the tab bar) ──
            HStack(spacing: 12) {
                // Album art placeholder
                RoundedRectangle(cornerRadius: 8)
                    .fill(.quaternary)
                    .frame(width: 44, height: 44)
                    .overlay {
                        Image(systemName: "music.note")
                            .font(.title3)
                            .foregroundStyle(.secondary)
                    }
                
                // Track info
                VStack(alignment: .leading, spacing: 2) {
                    Text(trackTitle)
                        .font(.subheadline)
                        .fontWeight(.semibold)
                        .lineLimit(1)
                    
                    Text(artistName)
                        .font(.caption)
                        .foregroundStyle(.secondary)
                        .lineLimit(1)
                }
                
                Spacer()
                
                // Playback controls
                HStack(spacing: 16) {
                    Button(action: onPlayPause) {
                        Image(systemName: isPlaying ? "pause.fill" : "play.fill")
                            .font(.title3)
                    }
                    
                    Button(action: {}) {
                        Image(systemName: "forward.fill")
                            .font(.subheadline)
                    }
                }
                .foregroundStyle(.primary)
            }
            .padding(.horizontal, 16)
            .padding(.vertical, 8)
            .contentShape(Rectangle())
            .onTapGesture(perform: onTap)
        }
    }
}

// MARK: - Fallback HybridRootView for iOS 18–25 (pre-iOS 26)
@available(iOS 18.0, *)
struct HybridRootViewLegacy: View {
    let bridgeVC: CAPBridgeViewController
    
    @State private var selectedTab = "home"
    @State private var isTabBarHidden = true
    @State private var showAlbumZoom = false
    
    var body: some View {
        ZStack(alignment: .bottom) {
            CapacitorBridgeView(bridgeVC: bridgeVC)
                .ignoresSafeArea()
            
            if !isTabBarHidden {
                LegacyNativeTabBar(selectedTab: $selectedTab)
                    .frame(height: 49)
                    .background(
                        Rectangle()
                            .fill(.regularMaterial)
                            .overlay(Divider(), alignment: .top)
                            .ignoresSafeArea(edges: .bottom)
                    )
                    .transition(.move(edge: .bottom).combined(with: .opacity))
            }
        }
        .onChange(of: selectedTab) { newValue in
            bridgeVC.webView?.evaluateJavaScript(
                "window.dispatchEvent(new CustomEvent('navigate', {detail: '\(newValue)'}))"
            )
        }
        .sheet(isPresented: $showAlbumZoom) {
            NativeAlbumDetailView()
                .presentationDetents([.height(180), .medium, .large])
                .presentationBackground(.thickMaterial)
        }
        .onReceive(NotificationCenter.default.publisher(for: NSNotification.Name("OpenNativeZoom"))) { _ in
            showAlbumZoom = true
        }
        .onReceive(NotificationCenter.default.publisher(for: NSNotification.Name("ToggleTabBar"))) { notification in
            if let hidden = notification.userInfo?["hidden"] as? Bool {
                withAnimation(.spring(response: 0.4, dampingFraction: 0.8)) {
                    isTabBarHidden = hidden
                }
            }
        }
    }
}

// MARK: - Legacy UITabBar wrapper (for iOS 18–25)
struct LegacyNativeTabBar: UIViewRepresentable {
    @Binding var selectedTab: String
    
    func makeUIView(context: Context) -> UITabBar {
        let tabBar = UITabBar()
        tabBar.delegate = context.coordinator
        
        let appearance = UITabBarAppearance()
        appearance.configureWithTransparentBackground()
        tabBar.standardAppearance = appearance
        if #available(iOS 15.0, *) {
            tabBar.scrollEdgeAppearance = appearance
        }
        
        let tabs = [
            ("home", "Inicio", "house"),
            ("search", "Buscar", "magnifyingglass"),
            ("library", "Librería", "square.stack.fill"),
            ("downloads", "Descargas", "arrow.down.circle"),
            ("settings", "Ajustes", "gearshape")
        ]
        
        let items = tabs.enumerated().map { index, tab -> UITabBarItem in
            let item = UITabBarItem(title: tab.1, image: UIImage(systemName: tab.2), tag: index)
            item.accessibilityIdentifier = tab.0
            return item
        }
        
        tabBar.items = items
        return tabBar
    }
    
    func updateUIView(_ uiView: UITabBar, context: Context) {
        if let items = uiView.items,
           let selected = items.first(where: { $0.accessibilityIdentifier == selectedTab }) {
            uiView.selectedItem = selected
        }
    }
    
    func makeCoordinator() -> Coordinator { Coordinator(self) }
    
    class Coordinator: NSObject, UITabBarDelegate {
        var parent: LegacyNativeTabBar
        init(_ parent: LegacyNativeTabBar) { self.parent = parent }
        
        func tabBar(_ tabBar: UITabBar, didSelect item: UITabBarItem) {
            if let id = item.accessibilityIdentifier {
                parent.selectedTab = id
            }
        }
    }
}

// MARK: - Native Album Detail (WWDC 2025 patterns)
// Uses confirmation dialog (7:41), toolbar menus (7:27), presentation detents (6:20)
@available(iOS 18.0, *)
struct NativeAlbumDetailView: View {
    @State private var presentDialog = false
    
    var body: some View {
        NavigationStack {
            ScrollView {
                Image(systemName: "music.quarternote.3")
                    .resizable()
                    .aspectRatio(contentMode: .fill)
                    .frame(height: 300)
                
                Label("Desert", systemImage: "sun.max.fill")
                    .padding()
                    .background(.ultraThinMaterial, in: Capsule())
            }
            .navigationTitle("Álbum")
            // ── Toolbar menus (WWDC 2025: 7:27) ──
            .toolbar {
                ToolbarItemGroup {
                    Button(action: {}) {
                        Image(systemName: "square.and.arrow.up")
                    }
                    
                    Menu("Collections", systemImage: "book.closed") {
                        Button("Favorite", action: {})
                    }
                    
                    // ── Confirmation dialog (WWDC 2025: 7:41) ──
                    Button("Delete", systemImage: "trash") {
                        presentDialog = true
                    }
                    .confirmationDialog("Delete?", isPresented: $presentDialog) {
                        Button("Delete", role: .destructive) { }
                    }
                }
            }
        }
    }
}

// MARK: - Bridge ViewController
class MyBridgeViewController: CAPBridgeViewController {
    override func capacitorDidLoad() {
        super.capacitorDidLoad()
        
        if let pluginClass = NSClassFromString("QobuzAudioPlugin") as? NSObject.Type,
           let pluginInstance = pluginClass.init() as? CAPPlugin {
            self.bridge?.registerPluginInstance(pluginInstance)
        }
    }
}

// MARK: - Scene Delegate
class SceneDelegate: UIResponder, UIWindowSceneDelegate {
    var window: UIWindow?

    func scene(_ scene: UIScene, willConnectTo session: UISceneSession, options connectionOptions: UIScene.ConnectionOptions) {
        guard let windowScene = scene as? UIWindowScene else { return }
        window = UIWindow(windowScene: windowScene)
        
        let bridgeVC = MyBridgeViewController()
        
        if #available(iOS 26, *) {
            // iOS 26+ → Full native SwiftUI TabView with Liquid Glass
            let hybridView = HybridRootView(bridgeVC: bridgeVC)
            let hostingVC = UIHostingController(rootView: hybridView)
            window?.rootViewController = hostingVC
        } else if #available(iOS 18.0, *) {
            // iOS 18–25 → Legacy UITabBar overlay approach
            let hybridView = HybridRootViewLegacy(bridgeVC: bridgeVC)
            let hostingVC = UIHostingController(rootView: hybridView)
            window?.rootViewController = hostingVC
        } else {
            // iOS < 18 → Pure WebView fallback
            window?.rootViewController = bridgeVC
        }
        
        window?.makeKeyAndVisible()
        SceneDelegateProxy.shared.scene(scene, willConnectTo: session, options: connectionOptions)
    }

    func scene(_ scene: UIScene, openURLContexts URLContexts: Set<UIOpenURLContext>) {
        SceneDelegateProxy.shared.scene(scene, openURLContexts: URLContexts)
    }

    func scene(_ scene: UIScene, continue userActivity: NSUserActivity) {
        SceneDelegateProxy.shared.scene(scene, continue: userActivity)
    }
}
