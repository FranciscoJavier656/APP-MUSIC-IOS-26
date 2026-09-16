import SwiftUI
import Capacitor

// Shared Capacitor Bridge
class SharedCapacitor {
    static let bridgeVC = MyBridgeViewController()
}

struct CapacitorView: UIViewControllerRepresentable {
    func makeUIViewController(context: Context) -> CAPBridgeViewController {
        return SharedCapacitor.bridgeVC
    }
    func updateUIViewController(_ uiViewController: CAPBridgeViewController, context: Context) {}
}

@available(iOS 18.0, *)
struct MainHybridView: View {
    @State private var selectedTab = "home"
    @State private var showAlbumSheet = false
    @State private var albumTitle = ""
    @State private var albumImage = ""
    
    // WWDC 26 (iOS 18) Zoom Transition Namespace
    @Namespace private var namespace
    
    var body: some View {
        // Use the actual iOS 18 TabView!
        TabView(selection: $selectedTab) {
            // We use a single Capacitor instance, and to avoid SwiftUI 
            // re-parenting issues, we just put it in the home tab.
            // React handles its own tab switching internally.
            ZStack {
                CapacitorView()
                    .ignoresSafeArea()
                
                // This hidden button acts as the anchor for the zoom transition
                // It's placed dynamically based on coordinates from React!
                if showAlbumSheet {
                    Color.clear
                        .matchedTransitionSource(id: "album-zoom", in: namespace)
                        .frame(width: 150, height: 150) // We can make this dynamic
                }
            }
            .tabItem { Label("Inicio", systemImage: "house") }
            .tag("home")
            
            // Dummy tabs to show the native iOS 18 tab bar
            Color.clear.tabItem { Label("Buscar", systemImage: "magnifyingglass") }.tag("search")
            Color.clear.tabItem { Label("Librería", systemImage: "square.stack.fill") }.tag("library")
            Color.clear.tabItem { Label("Descargas", systemImage: "arrow.down.circle") }.tag("downloads")
            Color.clear.tabItem { Label("Ajustes", systemImage: "gearshape") }.tag("settings")
        }
        .tabBarMinimizeBehavior(.onScrollDown) // WWDC code!
        .sheet(isPresented: $showAlbumSheet) {
            NativeAlbumDetailView(title: albumTitle, image: albumImage)
                .navigationTransition(.zoom(sourceID: "album-zoom", in: namespace)) // WWDC code!
                .presentationDetents([.large]) // WWDC code!
                .presentationBackground(.thickMaterial) // WWDC code!
        }
        .onChange(of: selectedTab) { newValue in
            // When native tab changes, tell React to change its internal route
            SharedCapacitor.bridgeVC.bridge?.evalWithPlugin("window.dispatchEvent(new CustomEvent('nativeTabSelected', {detail: '\(newValue)'}))")
            // Instantly snap back to 'home' tag in native so the Capacitor view remains visible
            if newValue != "home" {
                DispatchQueue.main.async { selectedTab = "home" }
            }
        }
        .onReceive(NotificationCenter.default.publisher(for: NSNotification.Name("OpenNativeAlbum"))) { notif in
            if let userInfo = notif.userInfo as? [String: String] {
                albumTitle = userInfo["title"] ?? "Album"
                albumImage = userInfo["image"] ?? ""
                showAlbumSheet = true
            }
        }
    }
}

@available(iOS 18.0, *)
struct NativeAlbumDetailView: View {
    var title: String
    var image: String
    
    var body: some View {
        NavigationStack {
            ScrollView {
                VStack {
                    // Just a placeholder for the native UI
                    Rectangle()
                        .fill(Color.gray.opacity(0.3))
                        .frame(height: 300)
                        .overlay(Text("Image: \(image)"))
                    
                    Text(title)
                        .font(.largeTitle)
                        .bold()
                        .padding()
                    
                    Spacer()
                }
            }
            .navigationTitle(title)
            .navigationBarTitleDisplayMode(.inline)
            // WWDC: Visually separate toolbar items
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button(action: {}) { Image(systemName: "square.and.arrow.up") }
                }
            }
        }
    }
}
