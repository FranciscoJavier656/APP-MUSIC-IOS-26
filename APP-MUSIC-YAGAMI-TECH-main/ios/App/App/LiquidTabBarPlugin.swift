import Foundation
import Capacitor
import SwiftUI
import UIKit

// MARK: - Shared State
class LiquidTabBarState: ObservableObject {
    @Published var activeTab: String = "home"
}

// MARK: - Capacitor Plugin
@objc(LiquidTabBarPlugin)
public class LiquidTabBarPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "LiquidTabBarPlugin"
    public let jsName = "LiquidTabBar"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "initializeTabBar", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "updateTab", returnType: CAPPluginReturnPromise)
    ]

    private var hostingController: UIViewController?
    private var activeTabState: LiquidTabBarState?

    @objc func initializeTabBar(_ call: CAPPluginCall) {
        let initialTab = call.getString("activeTab") ?? "home"

        DispatchQueue.main.async {
            if self.hostingController != nil {
                call.resolve()
                return
            }

            guard let vc = self.bridge?.viewController else {
                call.reject("Bridge ViewController is nil")
                return
            }

            let state = LiquidTabBarState()
            state.activeTab = initialTab
            self.activeTabState = state

            let tabBarView = LiquidTabBarView(state: state) { [weak self] newTab in
                self?.notifyListeners("onTabSelected", data: ["tabId": newTab])
            }

            let host = UIHostingController(rootView: tabBarView)
            host.view.backgroundColor = .clear
            host.view.isOpaque = false
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

            // Add content inset so web content doesn't hide behind the tab bar
            if let webView = self.bridge?.webView {
                webView.scrollView.contentInset = UIEdgeInsets(top: 0, left: 0, bottom: 100, right: 0)
            }

            print("⚡️ [LiquidTabBar] Native iOS 26 Liquid Glass TabBar attached.")
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

// MARK: - SwiftUI View — Real iOS 26 Liquid Glass
struct LiquidTabBarView: View {
    @ObservedObject var state: LiquidTabBarState
    var onTabSelected: (String) -> Void

    @Namespace private var tabBarNamespace

    let tabs: [(String, String, String)] = [
        ("home", "house.fill", "Inicio"),
        ("search", "magnifyingglass", "Buscar"),
        ("library", "square.stack.fill", "Librería"),
        ("downloads", "arrow.down.circle.fill", "Descargas"),
        ("settings", "gearshape.fill", "Ajustes")
    ]

    var body: some View {
        VStack {
            Spacer()
            if #available(iOS 26, *) {
                iOS26TabBar
            } else {
                fallbackTabBar
            }
        }
    }

    // ─────────────────────────────────────────────
    // iOS 26+: Real Apple Liquid Glass APIs
    // The system handles ALL the liquid physics,
    // refraction, blur, merging, and animation.
    // ─────────────────────────────────────────────
    @available(iOS 26, *)
    private var iOS26TabBar: some View {
        GlassEffectContainer {
            HStack(spacing: 0) {
                ForEach(tabs, id: \.0) { tab in
                    let isActive = state.activeTab == tab.0

                    Button {
                        onTabSelected(tab.0)
                        withAnimation(.spring(response: 0.45, dampingFraction: 0.7)) {
                            state.activeTab = tab.0
                        }
                    } label: {
                        VStack(spacing: 4) {
                            Image(systemName: tab.1)
                                .font(.system(size: isActive ? 22 : 20, weight: isActive ? .bold : .medium))
                                .symbolEffect(.bounce, value: isActive)
                            Text(tab.2)
                                .font(.system(size: 10, weight: isActive ? .bold : .medium))
                        }
                        .foregroundStyle(isActive ? .primary : .secondary)
                        .frame(maxWidth: .infinity)
                        .frame(height: 64)
                        .contentShape(Rectangle())
                    }
                    .buttonStyle(.plain)
                    .background {
                        if isActive {
                            // This capsule "bubbles up" above the bar
                            // The system merges it with the bar via glassEffectUnion
                            Capsule()
                                .fill(.clear)
                                .frame(width: 64, height: 88)
                                .offset(y: -12)
                                .glassEffect(.regular, in: .capsule)
                                .glassEffectUnion(id: "activeTab", namespace: tabBarNamespace)
                                .matchedGeometryEffect(id: "activeBubble", in: tabBarNamespace)
                        }
                    }
                }
            }
            .padding(.horizontal, 8)
            .frame(height: 64)
            .background {
                // Main bar glass — system handles blur, refraction, tinting
                Capsule()
                    .fill(.clear)
                    .glassEffect(.regular, in: .capsule)
                    .glassEffectUnion(id: "activeTab", namespace: tabBarNamespace)
            }
        }
        .padding(.horizontal, 16)
        .padding(.bottom, 8)
    }

    // ─────────────────────────────────────────────
    // Fallback for iOS < 26: .ultraThinMaterial
    // ─────────────────────────────────────────────
    private var fallbackTabBar: some View {
        HStack(spacing: 0) {
            ForEach(tabs, id: \.0) { tab in
                let isActive = state.activeTab == tab.0

                Button {
                    onTabSelected(tab.0)
                    withAnimation(.spring(response: 0.4, dampingFraction: 0.7)) {
                        state.activeTab = tab.0
                    }
                } label: {
                    VStack(spacing: 4) {
                        Image(systemName: tab.1)
                            .font(.system(size: isActive ? 22 : 20, weight: isActive ? .bold : .medium))
                        Text(tab.2)
                            .font(.system(size: 10, weight: isActive ? .bold : .medium))
                    }
                    .foregroundColor(isActive ? .white : .gray)
                    .frame(maxWidth: .infinity)
                    .frame(height: 64)
                    .contentShape(Rectangle())
                }
                .buttonStyle(.plain)
                .background {
                    if isActive {
                        Capsule()
                            .fill(.white.opacity(0.15))
                            .frame(width: 64, height: 88)
                            .offset(y: -12)
                            .matchedGeometryEffect(id: "activeBubble", in: tabBarNamespace)
                    }
                }
            }
        }
        .padding(.horizontal, 8)
        .frame(height: 64)
        .background(
            Capsule()
                .fill(.ultraThinMaterial)
                .shadow(color: .black.opacity(0.4), radius: 15, y: 10)
        )
        .padding(.horizontal, 16)
        .padding(.bottom, 8)
    }
}
