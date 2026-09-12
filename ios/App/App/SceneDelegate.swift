import UIKit
import Capacitor
import SwiftUI
import WebKit

// MARK: - TabView Transparency Injector
// This view walks up the UI hierarchy and forces all TabView containers to be transparent
struct TransparentTabBackground: UIViewRepresentable {
    func makeUIView(context: Context) -> UIView {
        let view = UIView()
        view.backgroundColor = .clear
        DispatchQueue.main.async {
            var superview = view.superview
            while let current = superview {
                let className = String(describing: type(of: current))
                // Force clear background on all structural container views created by TabView
                if className.contains("UITabBarController") || 
                   className.contains("UIHostingView") || 
                   className.contains("Tab") || 
                   className.contains("Hosting") || 
                   className.contains("View") {
                    
                    current.backgroundColor = .clear
                }
                superview = current.superview
            }
        }
        return view
    }

    func updateUIView(_ uiView: UIView, context: Context) {}
}

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
    
    init(bridgeVC: CAPBridgeViewController) {
        self.bridgeVC = bridgeVC
        // Make the native TabBar bottom bar background transparent
        let appearance = UITabBarAppearance()
        appearance.configureWithTransparentBackground()
        appearance.backgroundColor = .clear
        appearance.backgroundEffect = nil
        appearance.shadowColor = .clear
        
        UITabBar.appearance().standardAppearance = appearance
        UITabBar.appearance().scrollEdgeAppearance = appearance
    }
    
    var body: some View {
        ZStack {
            // 1. The WebView is ALWAYS active in the background, untouched.
            CapacitorBridgeView(bridgeVC: bridgeVC)
                .ignoresSafeArea()
            
            // 2. The REAL Apple Native TabView
            TabView(selection: $selectedTab) {
                TransparentTabBackground()
                    .allowsHitTesting(false) // Allows touches to pass through the empty center area down to the WebView
                    .tag("home")
                    .tabItem { Label("Inicio", systemImage: "house") }
                    
                TransparentTabBackground()
                    .allowsHitTesting(false)
                    .tag("search")
                    .tabItem { Label("Buscar", systemImage: "magnifyingglass") }
                    
                TransparentTabBackground()
                    .allowsHitTesting(false)
                    .tag("library")
                    .tabItem { Label("Librería", systemImage: "square.stack.fill") }
                    
                TransparentTabBackground()
                    .allowsHitTesting(false)
                    .tag("downloads")
                    .tabItem { Label("Descargas", systemImage: "arrow.down.circle") }
                    
                TransparentTabBackground()
                    .allowsHitTesting(false)
                    .tag("settings")
                    .tabItem { Label("Ajustes", systemImage: "gearshape") }
            }
            .onChange(of: selectedTab) { newValue in
                // Sync native selection to React without jumping back!
                bridgeVC.webView?.evaluateJavaScript("window.dispatchEvent(new CustomEvent('navigate', {detail: '\(newValue)'}))")
            }
        }
        .sheet(isPresented: $showAlbumZoom) {
            NativeAlbumDetailView()
                .presentationDetents([.height(180), .medium, .large])
                .presentationBackground(.thickMaterial)
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
