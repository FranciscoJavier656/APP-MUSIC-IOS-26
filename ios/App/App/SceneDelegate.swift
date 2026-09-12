import UIKit
import Capacitor
import SwiftUI
import WebKit

// MARK: - WebView Host for Tabs
// Safely moves the Capacitor WebView's UIView into the currently active tab
// without touching ViewControllers, preventing black screens during rapid switching.
struct WebViewHost: UIViewRepresentable {
    let bridgeVC: CAPBridgeViewController
    let isSelected: Bool

    func makeUIView(context: Context) -> UIView {
        let view = UIView()
        view.backgroundColor = .clear
        return view
    }

    func updateUIView(_ uiView: UIView, context: Context) {
        if isSelected {
            // Only move the view if it's not already here
            if bridgeVC.view.superview != uiView {
                bridgeVC.view.removeFromSuperview()
                bridgeVC.view.frame = uiView.bounds
                bridgeVC.view.autoresizingMask = [.flexibleWidth, .flexibleHeight]
                uiView.addSubview(bridgeVC.view)
            }
        }
    }
}

// MARK: - Hybrid Root View

@available(iOS 18.0, *)
struct HybridRootView: View {
    let bridgeVC: CAPBridgeViewController
    
    @State private var selectedTab = "home"
    @State private var showAlbumZoom = false
    @State private var isTabBarHidden = false
    @Namespace private var zoomNamespace
    
    var body: some View {
        // The REAL Apple Native TabView
        TabView(selection: $selectedTab) {
            WebViewHost(bridgeVC: bridgeVC, isSelected: selectedTab == "home")
                .ignoresSafeArea()
                .tag("home")
                .tabItem { Label("Inicio", systemImage: "house") }
                
            WebViewHost(bridgeVC: bridgeVC, isSelected: selectedTab == "search")
                .ignoresSafeArea()
                .tag("search")
                .tabItem { Label("Buscar", systemImage: "magnifyingglass") }
                
            WebViewHost(bridgeVC: bridgeVC, isSelected: selectedTab == "library")
                .ignoresSafeArea()
                .tag("library")
                .tabItem { Label("Librería", systemImage: "square.stack.fill") }
                
            WebViewHost(bridgeVC: bridgeVC, isSelected: selectedTab == "downloads")
                .ignoresSafeArea()
                .tag("downloads")
                .tabItem { Label("Descargas", systemImage: "arrow.down.circle") }
                
            WebViewHost(bridgeVC: bridgeVC, isSelected: selectedTab == "settings")
                .ignoresSafeArea()
                .tag("settings")
                .tabItem { Label("Ajustes", systemImage: "gearshape") }
        }
        .toolbar(isTabBarHidden ? .hidden : .visible, for: .tabBar) // iOS 16+ API for hiding the tab bar natively!
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
                withAnimation(.easeInOut(duration: 0.3)) {
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
            // HYBRID ARCHITECTURE: Inject Native SwiftUI TabBar and WWDC APIs wrapping the WebView
            let hybridView = HybridRootView(bridgeVC: bridgeVC)
            let hostingVC = UIHostingController(rootView: hybridView)
            
            window?.rootViewController = hostingVC
            
            // Bridge requires a strong reference cycle or to be in hierarchy to receive callbacks? 
            // We just reparent its view, so we must add it as a child VC to hostingVC so it receives lifecycle events.
            hostingVC.addChild(bridgeVC)
            bridgeVC.didMove(toParent: hostingVC)
            
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
