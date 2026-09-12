import SwiftUI
import Capacitor

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
    
    // WWDC 2024: Picker segmentado
    @State private var viewMode: String = "list"
    
    var body: some View {
        // WWDC 2024: Minimize tab bar on scroll
        TabView(selection: $selectedTab) {
            
            // Tab 1: Web Content (React/Capacitor)
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
            
            // Dummy tabs to populate the native Apple TabBar
            Color.clear.tag("search").tabItem { Label("Buscar", systemImage: "magnifyingglass") }
            Color.clear.tag("library").tabItem { Label("Librería", systemImage: "square.stack.fill") }
            Color.clear.tag("downloads").tabItem { Label("Descargas", systemImage: "arrow.down.circle") }
            Color.clear.tag("settings").tabItem { Label("Ajustes", systemImage: "gearshape") }
        }
        .tabBarMinimizeBehavior(.onScrollDown) // Exact iOS 18 API
        
        // WWDC 2024: Tab bar accessory (Mini player overlay)
        .tabViewBottomAccessory {
            NativeMiniPlayerAccessory()
        }
        
        // WWDC 2024: Zoom transition sheet
        .sheet(isPresented: $showAlbumZoom) {
            NativeAlbumDetailView()
                .presentationDetents([.height(180), .medium, .large]) // WWDC
                .presentationBackground(.thickMaterial) // WWDC
                .navigationTransition(.zoom(sourceID: "album-transition", in: zoomNamespace)) // WWDC
        }
        
        // Listen to Web -> Native messages
        .onReceive(NotificationCenter.default.publisher(for: NSNotification.Name("OpenNativeZoom"))) { _ in
            showAlbumZoom = true
        }
    }
}

// MARK: - Native Components requested from WWDC

@available(iOS 18.0, *)
struct NativeMiniPlayerAccessory: View {
    @Environment(\.tabViewBottomAccessoryPlacement) var placement
    
    var body: some View {
        if placement == .inline {
            HStack {
                Image(systemName: "music.note.list")
                Text("Reproduciendo...")
            }
            .glassEffect()
        } else {
            // Full layout
            Color.clear
        }
    }
}

@available(iOS 18.0, *)
struct NativeAlbumDetailView: View {
    @State private var presentDialog = false
    
    var body: some View {
        NavigationStack {
            ScrollView {
                // WWDC: Extend background images
                Image(systemName: "music.quarternote.3")
                    .resizable()
                    .aspectRatio(contentMode: .fill)
                    .frame(height: 300)
                    .backgroundExtensionEffect()
                
                // WWDC: Interactive glass effect
                Label("Desert", systemImage: "sun.max.fill")
                    .padding()
                    .glassEffect(.regular.interactive())
            }
            .navigationTitle("Álbum")
            
            // WWDC: Toolbar menus & Confirmation dialog
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
            .scrollEdgeEffectStyle(.hard, for: .top)
        }
    }
}

// MARK: - Polyfills / Helpers for GlassEffect

public enum GlassEffectStyle {
    case regular
    case tint(Color)
    public func interactive() -> GlassEffectStyle { return self }
}

public extension View {
    @ViewBuilder
    func glassEffect(_ style: GlassEffectStyle? = nil) -> some View {
        self.background(.ultraThinMaterial, in: Capsule())
    }
}
