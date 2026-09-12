import UIKit
import Capacitor
import SwiftUI

// MARK: - Hybrid Root View & Components

// Wraps the Capacitor WKWebView so it can be used inside SwiftUI
struct CapacitorBridgeView: UIViewControllerRepresentable {
    let bridgeVC: CAPBridgeViewController
    
    func makeUIViewController(context: Context) -> CAPBridgeViewController {
        return bridgeVC
    }
    
    func updateUIViewController(_ uiViewController: CAPBridgeViewController, context: Context) {}
}

struct HybridRootView: View {
    let bridgeVC: CAPBridgeViewController
    
    @State private var selectedTab = "home"
    @State private var showAlbumZoom = false
    @Namespace private var zoomNamespace
    
    var body: some View {
        TabView(selection: $selectedTab) {
            
            CapacitorBridgeView(bridgeVC: bridgeVC)
                .ignoresSafeArea()
                .tag("home")
                .tabItem { Label("Inicio", systemImage: "house") }
                
                // Zoom transition source anchor for the WebView
                .toolbar {
                    ToolbarItem(placement: .bottomBar) {
                        Color.clear
                            .frame(width: 100, height: 100)
                            .matchedTransitionSource(id: "album-transition", in: zoomNamespace)
                    }
                }
            
            Color.clear.tag("search").tabItem { Label("Buscar", systemImage: "magnifyingglass") }
            Color.clear.tag("library").tabItem { Label("Librería", systemImage: "square.stack.fill") }
            Color.clear.tag("downloads").tabItem { Label("Descargas", systemImage: "arrow.down.circle") }
            Color.clear.tag("settings").tabItem { Label("Ajustes", systemImage: "gearshape") }
        }
        .onChange(of: selectedTab) { newValue in
            // When native tab changes, tell React to change its internal route
            bridgeVC.bridge?.evalWithPlugin("window.dispatchEvent(new CustomEvent('navigate', {detail: '\(newValue)'}))")
            
            // Instantly snap back to 'home' tag in native so the Capacitor webview remains visible
            // since the webview handles its own tab rendering inside 'home'
            if newValue != "home" {
                DispatchQueue.main.async { selectedTab = "home" }
            }
        }
        .tabBarMinimizeBehavior(.onScrollDown) // WWDC iOS 26 API
        .sheet(isPresented: $showAlbumZoom) {
            NativeAlbumDetailView()
                .presentationDetents([.height(180), .medium, .large]) // WWDC
                .presentationBackground(.thickMaterial) // WWDC
                .navigationTransition(.zoom(sourceID: "album-transition", in: zoomNamespace)) // WWDC
        }
        .onReceive(NotificationCenter.default.publisher(for: NSNotification.Name("OpenNativeZoom"))) { _ in
            showAlbumZoom = true
        }
    }
}

// MARK: - Native Components requested from WWDC


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
                    .glassEffect()
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
    override open func capacitorDidLoad() {
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
        
        if #available(iOS 26.0, *) {
            // HYBRID ARCHITECTURE: Inject Native SwiftUI TabBar and WWDC APIs wrapping the WebView
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
