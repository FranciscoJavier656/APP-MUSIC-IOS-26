const fs = require('fs');

// 1. Recrear LiquidTabBarPlugin.swift con el código YagamiGlass (sin colisiones)
const liquidSwift = `import Foundation
import Capacitor
import SwiftUI
import UIKit

class LiquidTabBarState: ObservableObject {
    @Published var activeTab: String = "home"
}

@objc(LiquidTabBarPlugin)
public class LiquidTabBarPlugin: CAPPlugin {
    private var hostingController: UIHostingController<LiquidTabBarView>?
    private var activeTabState: LiquidTabBarState?

    private func showAlert(title: String, message: String) {
        DispatchQueue.main.async {
            let alert = UIAlertController(title: title, message: message, preferredStyle: .alert)
            alert.addAction(UIAlertAction(title: "OK", style: .default))
            self.bridge?.viewController?.present(alert, animated: true)
        }
    }

    @objc func initializeTabBar(_ call: CAPPluginCall) {
        let initialTab = call.getString("activeTab") ?? "home"
        
        DispatchQueue.main.async {
            if self.hostingController == nil {
                guard let vc = self.bridge?.viewController else {
                    self.showAlert(title: "Error", message: "Bridge ViewController is nil")
                    call.reject("Bridge ViewController is nil")
                    return
                }

                let state = LiquidTabBarState()
                state.activeTab = initialTab
                self.activeTabState = state
                
                let view = LiquidTabBarView(state: state) { [weak self] newTab in
                    self?.notifyListeners("onTabSelected", data: ["tabId": newTab])
                }
                
                let host = UIHostingController(rootView: view)
                host.view.backgroundColor = .clear
                host.view.translatesAutoresizingMaskIntoConstraints = false
                
                vc.addChild(host)
                vc.view.addSubview(host.view)
                
                NSLayoutConstraint.activate([
                    host.view.leadingAnchor.constraint(equalTo: vc.view.leadingAnchor),
                    host.view.trailingAnchor.constraint(equalTo: vc.view.trailingAnchor),
                    host.view.bottomAnchor.constraint(equalTo: vc.view.bottomAnchor),
                    host.view.heightAnchor.constraint(equalToConstant: 140)
                ])
                
                host.didMove(toParent: vc)
                vc.view.bringSubviewToFront(host.view)
                host.view.layer.zPosition = 9999
                self.hostingController = host
                
                if let webView = self.bridge?.webView {
                    webView.scrollView.contentInset = UIEdgeInsets(top: 0, left: 0, bottom: 130, right: 0)
                }
                
                self.showAlert(title: "Liquid Glass", message: "iOS 26 Liquid TabBar Attached successfully!")
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
        YagamiGlassEffectContainer {
            ZStack {
                Capsule()
                    .fill(Color.clear)
                    .yagamiGlassEffect(.autoGlass, in: Capsule())
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
                                Capsule()
                                    .fill(Color.clear)
                                    .frame(width: 70, height: 95)
                                    .offset(y: -12)
                                    .yagamiGlassEffect(.autoGlass, in: Capsule())
                                    .yagamiGlassEffectUnion(id: "activeBubble_\\(tab.0)", namespace: glassSpace)
                                    .matchedGeometryEffect(id: "bubble", in: glassSpace)
                            }
                        }
                    }
                }
                .padding(.horizontal, 10)
            }
        }
        .padding(.horizontal, 20)
        .padding(.bottom, 30)
    }
}

public enum YagamiGlassStyle {
    case autoGlass
}

public extension View {
    @ViewBuilder
    func yagamiGlassEffect<S: Shape>(_ style: YagamiGlassStyle = .autoGlass, in shape: S) -> some View {
        self.background(
            shape.fill(.ultraThinMaterial)
        )
        .background(
            shape.fill(Color.black.opacity(0.3))
        )
        .overlay(shape.stroke(Color.red.opacity(0.4), lineWidth: 1.5).offset(x: -1, y: -0.5))
        .overlay(shape.stroke(Color.cyan.opacity(0.4), lineWidth: 1.5).offset(x: 1, y: 0.5))
        .overlay(shape.stroke(Color.white.opacity(0.4), lineWidth: 1))
        .shadow(color: .black.opacity(0.6), radius: 15, x: 0, y: 10)
    }
    
    @ViewBuilder
    func yagamiGlassEffectUnion(id: String, namespace: Namespace.ID) -> some View {
        self
    }
}

public struct YagamiGlassEffectContainer<Content: View>: View {
    public let content: () -> Content
    
    public init(@ViewBuilder content: @escaping () -> Content) {
        self.content = content
    }
    
    public var body: some View {
        content()
            .compositingGroup()
    }
}
`;

fs.writeFileSync('ios/App/App/LiquidTabBarPlugin.swift', liquidSwift);
console.log("Restored LiquidTabBarPlugin.swift");

// 2. Limpiar QobuzAudioPlugin.swift de la inyección anterior para evitar duplicados
const qobuzSwift = `import Foundation
import Capacitor
import SwiftUI
import UIKit

// --- QOBUZ DUMMY ---
@objc(QobuzAudioPluginSwiftDummy)
public class QobuzAudioPluginSwiftDummy: CAPPlugin {}
`;
fs.writeFileSync('ios/App/App/QobuzAudioPlugin.swift', qobuzSwift);
console.log("Cleaned up QobuzAudioPlugin.swift");

// 3. Crear el archivo de registro en Objective-C para que Capacitor lo reconozca
const liquidObjc = `#import <Capacitor/Capacitor.h>

CAP_PLUGIN(LiquidTabBarPlugin, "LiquidTabBar",
    CAP_PLUGIN_METHOD(initializeTabBar, CAPPluginReturnPromise);
    CAP_PLUGIN_METHOD(updateTab, CAPPluginReturnPromise);
)
`;
fs.writeFileSync('ios/App/App/LiquidTabBarPlugin.m', liquidObjc);
console.log("Created LiquidTabBarPlugin.m");

