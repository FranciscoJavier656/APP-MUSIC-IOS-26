import SwiftUI
import Capacitor

@available(iOS 18.0, *)
struct HybridRootView2: View {
    let bridgeVC: CAPBridgeViewController
    
    @State private var selectedTab = "home"
    
    var body: some View {
        ZStack {
            // Web view is always present and active in the background
            CapacitorBridgeView(bridgeVC: bridgeVC)
                .ignoresSafeArea()
            
            // Invisible TabView just provides the native bottom bar
            TabView(selection: $selectedTab) {
                Color.clear.tag("home").tabItem { Label("Inicio", systemImage: "house") }
                Color.clear.tag("search").tabItem { Label("Buscar", systemImage: "magnifyingglass") }
                Color.clear.tag("library").tabItem { Label("Librería", systemImage: "square.stack.fill") }
                Color.clear.tag("downloads").tabItem { Label("Descargas", systemImage: "arrow.down.circle") }
                Color.clear.tag("settings").tabItem { Label("Ajustes", systemImage: "gearshape") }
            }
            .onChange(of: selectedTab) { newValue in
                bridgeVC.webView?.evaluateJavaScript("window.dispatchEvent(new CustomEvent('navigate', {detail: '\(newValue)'}))")
            }
        }
    }
}
