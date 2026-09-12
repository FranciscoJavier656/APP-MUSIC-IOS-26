import UIKit
import Capacitor
import SwiftUI
import WebKit

// MARK: - Native TabBar Overlay Component
// This provides the 100% authentic Apple UITabBar natively,
// but as an overlay that will NEVER block touches to the WebView.
struct RealNativeTabBar: UIViewRepresentable {
    @Binding var selectedTab: String
    
    func makeUIView(context: Context) -> UITabBar {
        let tabBar = UITabBar()
        tabBar.delegate = context.coordinator
        
        // Remove native background to let SwiftUI's .regularMaterial handle the safe area stretch perfectly
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
        if let items = uiView.items, let selected = items.first(where: { $0.accessibilityIdentifier == selectedTab }) {
            uiView.selectedItem = selected
        }
    }
    
    func makeCoordinator() -> Coordinator {
        Coordinator(self)
    }
    
    class Coordinator: NSObject, UITabBarDelegate {
        var parent: RealNativeTabBar
        
        init(_ parent: RealNativeTabBar) {
            self.parent = parent
        }
        
        func tabBar(_ tabBar: UITabBar, didSelect item: UITabBarItem) {
            if let id = item.accessibilityIdentifier {
                parent.selectedTab = id
            }
        }
    }
}

// MARK: - Hybrid Root View & Bridge
struct CapacitorBridgeView: UIViewControllerRepresentable {
    let bridgeVC: CAPBridgeViewController
    
    func makeUIViewController(context: Context) -> CAPBridgeViewController {
        return bridgeVC
    }
    
    func updateUIViewController(_ uiViewController: CAPBridgeViewController, context: Context) {}
}

@available(iOS 18.0, *)
struct HybridRootView: View {
    let bridgeVC: CAPBridgeViewController
    
    @State private var selectedTab = "home"
    @State private var showAlbumZoom = false
    // Start hidden! The React app will unhide it after the intro animation via LiquidTabBar.setHidden(false)
    @State private var isTabBarHidden = true 
    @Namespace private var zoomNamespace
    
    var body: some View {
        ZStack(alignment: .bottom) {
            // 1. The WebView is ALWAYS active in the background, untouched.
            CapacitorBridgeView(bridgeVC: bridgeVC)
                .ignoresSafeArea()
            
            // 2. The Native Apple UITabBar overlay (bottom only!)
            if !isTabBarHidden {
                RealNativeTabBar(selectedTab: $selectedTab)
                    .frame(height: 49) // Standard TabBar height
                    .background(
                        Rectangle()
                            .fill(.regularMaterial) // Apple's authentic native blur
                            .overlay(Divider(), alignment: .top) // Native top border
                            .ignoresSafeArea(edges: .bottom) // Stretches the blur to the physical bottom edge
                    )
                    .transition(.move(edge: .bottom).combined(with: .opacity))
            }
        }
        .onChange(of: selectedTab) { newValue in
            // Sync native selection to React
            bridgeVC.webView?.evaluateJavaScript("window.dispatchEvent(new CustomEvent('navigate', {detail: '\(newValue)'}))")
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

// MARK: - Native Components requested from WWDC

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
            .toolbar {
                ToolbarItemGroup {
                    Button(action: {}) { Image(systemName: "square.and.arrow.up") }
                    
                    Menu("Collections", systemImage: "book.closed") {
                        Button("Favorite", action: {})
                    }
                    
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

// MARK: - App & Scene Delegates

class MyBridgeViewController: CAPBridgeViewController {
    override func capacitorDidLoad() {
        super.capacitorDidLoad()
        
        if let pluginClass = NSClassFromString("QobuzAudioPlugin") as? NSObject.Type,
           let pluginInstance = pluginClass.init() as? CAPPlugin {
            self.bridge?.registerPluginInstance(pluginInstance)
        }
    }
}

class SceneDelegate: UIResponder, UIWindowSceneDelegate {
    var window: UIWindow?

    func scene(_ scene: UIScene, willConnectTo session: UISceneSession, options connectionOptions: UIScene.ConnectionOptions) {
        guard let windowScene = scene as? UIWindowScene else { return }
        window = UIWindow(windowScene: windowScene)
        
        let bridgeVC = MyBridgeViewController()
        
        if #available(iOS 18.0, *) {
            // HYBRID ARCHITECTURE
            let hybridView = HybridRootView(bridgeVC: bridgeVC)
            let hostingVC = UIHostingController(rootView: hybridView)
            
            window?.rootViewController = hostingVC
        } else {
            // Fallback for older iOS versions
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
