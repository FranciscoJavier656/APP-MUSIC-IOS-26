import UIKit
import Capacitor
import SwiftUI
import WebKit

// MARK: - Hybrid Root View & Components

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
            
            // To ensure the TabView's background doesn't block the webview, we set it to transparent
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
