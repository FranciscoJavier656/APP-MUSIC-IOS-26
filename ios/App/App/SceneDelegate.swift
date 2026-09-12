import UIKit
import Capacitor
import SwiftUI
import WebKit

// MARK: - Magic Transparency Hack
// This makes the native UITabBarController completely transparent behind the tab bar,
// allowing our ZStack background (the Capacitor WebView) to shine through on ALL tabs.
extension UITabBarController {
    override open func viewDidLoad() {
        super.viewDidLoad()
        self.view.backgroundColor = .clear
    }
}

// MARK: - Hybrid Root View & Components

// Wraps the Capacitor WKWebView so it can be used inside SwiftUI
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
    @Namespace private var zoomNamespace
    
    var body: some View {
        ZStack {
            // 1. The WebView is ALWAYS active in the background, untouched.
            CapacitorBridgeView(bridgeVC: bridgeVC)
                .ignoresSafeArea()
            
            // 2. The REAL Apple Native TabView!
            TabView(selection: $selectedTab) {
                Color.clear
                    .allowsHitTesting(false)
                    .tag("home")
                    .tabItem { Label("Inicio", systemImage: "house") }
                    
                Color.clear
                    .allowsHitTesting(false)
                    .tag("search")
                    .tabItem { Label("Buscar", systemImage: "magnifyingglass") }
                    
                Color.clear
                    .allowsHitTesting(false)
                    .tag("library")
                    .tabItem { Label("Librería", systemImage: "square.stack.fill") }
                    
                Color.clear
                    .allowsHitTesting(false)
                    .tag("downloads")
                    .tabItem { Label("Descargas", systemImage: "arrow.down.circle") }
                    
                Color.clear
                    .allowsHitTesting(false)
                    .tag("settings")
                    .tabItem { Label("Ajustes", systemImage: "gearshape") }
            }
            .tabBarMinimizeBehavior(.onScrollDown) // Restored real WWDC API
            .onChange(of: selectedTab) { newValue in
                // Sync native selection to React without jumping back!
                bridgeVC.webView?.evaluateJavaScript("window.dispatchEvent(new CustomEvent('navigate', {detail: '\(newValue)'}))")
            }
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
            // HYBRID ARCHITECTURE: Inject Native SwiftUI TabBar and WWDC APIs wrapping the WebView
            let hybridView = HybridRootView(bridgeVC: bridgeVC)
            let hostingVC = UIHostingController(rootView: hybridView)
            
            // To ensure the TabView's background doesn't block the webview, we set the hosting view to transparent
            hostingVC.view.backgroundColor = .clear
            
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
