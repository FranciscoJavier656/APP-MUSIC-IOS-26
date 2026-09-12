import UIKit
import Capacitor
import SwiftUI
import WebKit

// MARK: - Native Bridge Reparenter
// This solves all transparency and touch issues by taking the single Capacitor WebView
// and natively moving it to whatever tab is currently active.
// It prevents the WebView from being reloaded, keeps state, and uses 100% standard Apple TabView behavior.
struct SharedBridgeViewController: UIViewControllerRepresentable {
    let bridgeVC: CAPBridgeViewController
    
    func makeUIViewController(context: Context) -> UIViewController {
        let vc = UIViewController()
        vc.view.backgroundColor = .clear
        return vc
    }
    
    func updateUIViewController(_ uiViewController: UIViewController, context: Context) {
        if bridgeVC.parent != uiViewController {
            // Detach from previous tab
            bridgeVC.willMove(toParent: nil)
            bridgeVC.view.removeFromSuperview()
            bridgeVC.removeFromParent()
            
            // Attach to the current active tab
            uiViewController.addChild(bridgeVC)
            bridgeVC.view.frame = uiViewController.view.bounds
            bridgeVC.view.autoresizingMask = [.flexibleWidth, .flexibleHeight]
            uiViewController.view.addSubview(bridgeVC.view)
            bridgeVC.didMove(toParent: uiViewController)
        }
    }
}

// MARK: - Hybrid Root View & Components

@available(iOS 18.0, *)
struct HybridRootView: View {
    let bridgeVC: CAPBridgeViewController
    
    @State private var selectedTab = "home"
    @State private var showAlbumZoom = false
    @Namespace private var zoomNamespace
    
    var body: some View {
        // The REAL Apple Native TabView
        TabView(selection: $selectedTab) {
            SharedBridgeViewController(bridgeVC: bridgeVC)
                .ignoresSafeArea()
                .tag("home")
                .tabItem { Label("Inicio", systemImage: "house") }
                
            SharedBridgeViewController(bridgeVC: bridgeVC)
                .ignoresSafeArea()
                .tag("search")
                .tabItem { Label("Buscar", systemImage: "magnifyingglass") }
                
            SharedBridgeViewController(bridgeVC: bridgeVC)
                .ignoresSafeArea()
                .tag("library")
                .tabItem { Label("Librería", systemImage: "square.stack.fill") }
                
            SharedBridgeViewController(bridgeVC: bridgeVC)
                .ignoresSafeArea()
                .tag("downloads")
                .tabItem { Label("Descargas", systemImage: "arrow.down.circle") }
                
            SharedBridgeViewController(bridgeVC: bridgeVC)
                .ignoresSafeArea()
                .tag("settings")
                .tabItem { Label("Ajustes", systemImage: "gearshape") }
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
