const fs = require('fs');

const swiftCode = `import Foundation
import Capacitor
import SwiftUI
import UIKit

// Move state outside to avoid nested class issues
class LiquidTabBarState: ObservableObject {
    @Published var activeTab: String = "home"
}

@objc(LiquidTabBarPlugin)
public class LiquidTabBarPlugin: CAPPlugin {
    private var hostingController: UIHostingController<LiquidTabBarView>?
    private var activeTabState: LiquidTabBarState?

    @objc func initializeTabBar(_ call: CAPPluginCall) {
        let initialTab = call.getString("activeTab") ?? "home"
        
        DispatchQueue.main.async {
            if self.hostingController == nil {
                let state = LiquidTabBarState()
                state.activeTab = initialTab
                self.activeTabState = state
                
                let view = LiquidTabBarView(state: state) { [weak self] newTab in
                    self?.notifyListeners("onTabSelected", data: ["tabId": newTab])
                }
                
                let host = UIHostingController(rootView: view)
                host.view.backgroundColor = .clear
                
                // FORCE attachment to the absolute main window (Bypasses Capacitor's ViewController hierarchy entirely)
                let windowScene = UIApplication.shared.connectedScenes.first(where: { $0.activationState == .foregroundActive }) as? UIWindowScene
                let window = windowScene?.windows.first(where: { $0.isKeyWindow }) ?? UIApplication.shared.windows.first
                
                if let window = window {
                    host.view.translatesAutoresizingMaskIntoConstraints = false
                    window.addSubview(host.view)
                    
                    NSLayoutConstraint.activate([
                        host.view.leadingAnchor.constraint(equalTo: window.leadingAnchor),
                        host.view.trailingAnchor.constraint(equalTo: window.trailingAnchor),
                        host.view.bottomAnchor.constraint(equalTo: window.bottomAnchor),
                        host.view.heightAnchor.constraint(equalToConstant: 140)
                    ])
                    
                    host.view.layer.zPosition = .greatestFiniteMagnitude
                    self.hostingController = host
                    
                    // Transparencia total en el WebView para revelar el cristal
                    if let webView = self.bridge?.webView {
                        webView.scrollView.contentInset = UIEdgeInsets(top: 0, left: 0, bottom: 130, right: 0)
                        webView.isOpaque = false
                        webView.backgroundColor = UIColor.clear
                        webView.scrollView.backgroundColor = UIColor.clear
                    }
                } else {
                    // Alert if window fails
                    self.bridge?.webView?.evaluateJavaScript("alert('SWIFT ERROR: KeyWindow not found!');", completionHandler: nil)
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
    @ObservedObject var state: LiquidTabBarState
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
        GlassEffectContainer {
            ZStack {
                // Base Tab Bar - Using clear fill so ultraThinMaterial shines through
                Capsule()
                    .fill(Color.clear)
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
console.log("Attached to UIWindow bypassing Capacitor view controllers!");
