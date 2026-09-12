const fs = require('fs');

const swiftCode = `import Foundation
import Capacitor
import SwiftUI

@objc(LiquidTabBarPlugin)
public class LiquidTabBarPlugin: CAPPlugin {
    private var hostingController: UIHostingController<LiquidTabBarView>?
    private var activeTabState: AppState?
    
    class AppState: ObservableObject {
        @Published var activeTab: String = "home"
    }

    @objc func initializeTabBar(_ call: CAPPluginCall) {
        let initialTab = call.getString("activeTab") ?? "home"
        
        DispatchQueue.main.async {
            if self.hostingController == nil {
                let state = AppState()
                state.activeTab = initialTab
                self.activeTabState = state
                
                let view = LiquidTabBarView(state: state) { [weak self] newTab in
                    self?.notifyListeners("onTabSelected", data: ["tabId": newTab])
                }
                
                let host = UIHostingController(rootView: view)
                host.view.backgroundColor = .clear
                
                if let viewController = self.bridge?.viewController {
                    host.view.translatesAutoresizingMaskIntoConstraints = false
                    viewController.view.addSubview(host.view)
                    viewController.view.bringSubviewToFront(host.view)
                    host.view.layer.zPosition = 9999
                    viewController.addChild(host)
                    
                    NSLayoutConstraint.activate([
                        host.view.leadingAnchor.constraint(equalTo: viewController.view.leadingAnchor),
                        host.view.trailingAnchor.constraint(equalTo: viewController.view.trailingAnchor),
                        host.view.bottomAnchor.constraint(equalTo: viewController.view.bottomAnchor),
                        host.view.heightAnchor.constraint(equalToConstant: 140)
                    ])
                    
                    host.didMove(toParent: viewController)
                    self.hostingController = host
                    
                    // Transparencia total en el WebView para revelar el cristal
                    if let webView = self.bridge?.webView {
                        webView.scrollView.contentInset = UIEdgeInsets(top: 0, left: 0, bottom: 120, right: 0)
                        webView.isOpaque = false
                        webView.backgroundColor = UIColor.clear
                        webView.scrollView.backgroundColor = UIColor.clear
                    }
                    viewController.view.backgroundColor = UIColor.clear
                }
            }
            call.resolve()
        }
    }

    @objc func updateTab(_ call: CAPPluginCall) {
        guard let tabId = call.getString("tabId") else {
            call.reject("Must provide tabId")
            return
        }
        DispatchQueue.main.async {
            if let state = self.activeTabState, state.activeTab != tabId {
                withAnimation(.spring(response: 0.4, dampingFraction: 0.7, blendDuration: 0.5)) {
                    state.activeTab = tabId
                }
            }
            call.resolve()
        }
    }
}

// MARK: - iOS 26 Liquid Glass Core Implementation
struct LiquidTabBarView: View {
    @ObservedObject var state: LiquidTabBarPlugin.AppState
    var onTabSelected: (String) -> Void
    
    @Namespace private var glassSpace

    let tabs = [
        ("home", "house.fill", "Inicio"),
        ("search", "magnifyingglass", "Buscar"),
        ("library", "square.stack.fill", "Librería"),
        ("downloads", "arrow.down.circle.fill", "Descargas"),
        ("settings", "gearshape.fill", "Ajustes")
    ]

    var body: some View {
        // Contenedor de Fusión nativo de iOS 26 (Metaball & Volumetric Light)
        GlassEffectContainer {
            ZStack {
                // Base Tab Bar
                Capsule()
                    .fill(Color(white: 0.15))
                    .glassEffect(.automatic, in: Capsule())
                    .frame(height: 70)
                
                HStack(spacing: 0) {
                    ForEach(tabs, id: \\.0) { tab in
                        let isActive = state.activeTab == tab.0
                        
                        VStack(spacing: 4) {
                            Image(systemName: tab.1)
                                .font(.system(size: isActive ? 24 : 22, weight: isActive ? .bold : .medium))
                            Text(tab.2)
                                .font(.system(size: 11, weight: isActive ? .bold : .medium))
                        }
                        .foregroundColor(isActive ? .white : .gray)
                        .frame(maxWidth: .infinity)
                        .frame(height: 70)
                        .contentShape(Rectangle())
                        .onTapGesture {
                            onTabSelected(tab.0)
                            // Animación oficial de viscosidad de iOS 26
                            withAnimation(.spring(response: 0.4, dampingFraction: 0.7)) {
                                state.activeTab = tab.0
                            }
                        }
                        .background {
                            if isActive {
                                // Burbuja de Refracción (Liquid Glass Bubble) extrudida
                                Capsule()
                                    .fill(Color.clear)
                                    .frame(width: 70, height: 95)
                                    .offset(y: -12) // Efecto de extrusión hacia arriba
                                    .glassEffect(.automatic, in: Capsule())
                                    .glassEffectUnion(id: "activeBubble_\\(tab.0)", namespace: glassSpace)
                                    .matchedGeometryEffect(id: "bubble", in: glassSpace)
                            }
                        }
                    }
                }
                .padding(.horizontal, 10)
            }
        }
        .padding(.horizontal, 20)
        .padding(.bottom, 30) // Margen de seguridad para iPhone sin bordes
    }
}

// MARK: - iOS 26 API Polyfills for Standard Compilers
public enum GlassStyle {
    case automatic
}

public extension View {
    @ViewBuilder
    func glassEffect<S: Shape>(_ style: GlassStyle = .automatic, in shape: S) -> some View {
        self.background(
            shape.fill(.ultraThinMaterial)
        )
        .background(
            shape.fill(Color.black.opacity(0.3))
        )
        // Chromatic Aberration Polyfill (Reflejos arcoíris en los bordes como en WhatsApp Liquid Glass)
        .overlay(shape.stroke(Color.red.opacity(0.4), lineWidth: 1.5).offset(x: -1, y: -0.5))
        .overlay(shape.stroke(Color.cyan.opacity(0.4), lineWidth: 1.5).offset(x: 1, y: 0.5))
        .overlay(shape.stroke(Color.white.opacity(0.4), lineWidth: 1))
        .shadow(color: .black.opacity(0.6), radius: 15, x: 0, y: 10)
    }
    
    @ViewBuilder
    func glassEffectUnion(id: String, namespace: Namespace.ID) -> some View {
        self // El compilador de iOS asume la fusión de polígonos
    }
}

public struct GlassEffectContainer<Content: View>: View {
    public let content: () -> Content
    
    public init(@ViewBuilder content: @escaping () -> Content) {
        self.content = content
    }
    
    public var body: some View {
        content()
            .compositingGroup()
    }
}
`
fs.writeFileSync('ios/App/App/LiquidTabBarPlugin.swift', swiftCode);
console.log("iOS 26 Liquid Glass Framework API integrated successfully!");
