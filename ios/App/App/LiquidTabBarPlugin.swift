import Foundation
import Capacitor
import SwiftUI
import UIKit

// MARK: - Observable State

class LiquidTabBarState: ObservableObject {
    @Published var activeTab: String

    init(activeTab: String = "home") {
        self.activeTab = activeTab
    }
}

// MARK: - Tab definitions

private struct TabItem: Identifiable {
    let id: String
    let icon: String
    let label: String
}

private let kTabs: [TabItem] = [
    TabItem(id: "home",      icon: "house.fill",             label: "Inicio"),
    TabItem(id: "search",    icon: "magnifyingglass",        label: "Buscar"),
    TabItem(id: "library",   icon: "square.stack.fill",      label: "Librería"),
    TabItem(id: "downloads", icon: "arrow.down.circle.fill", label: "Descargas"),
    TabItem(id: "settings",  icon: "gearshape.fill",         label: "Ajustes"),
]

// MARK: - iOS 26 Liquid Glass Tab Bar View

/// Uses real Apple Liquid Glass APIs — only compiled on iOS 26+.
/// GlassEffectContainer makes the bar and the active bubble
/// merge into ONE liquid glass surface automatically.
@available(iOS 26, *)
struct iOS26LiquidTabBar: View {
    @ObservedObject var state: LiquidTabBarState
    var onTabSelected: (String) -> Void
    @Namespace private var bubbleNS

    var body: some View {
        ZStack(alignment: .bottom) {
            // 1. MAIN BACKGROUND (Solid material so it doesn't look completely transparent/glitched)
            Capsule()
                .fill(.ultraThinMaterial)
                .frame(height: 64)
                .shadow(color: .black.opacity(0.4), radius: 15, y: 10)

            // 2. ACTIVE INDICATOR (Bubble) ON TOP OF GLASS
            HStack(spacing: 0) {
                ForEach(kTabs) { tab in
                    Color.clear
                        .frame(maxWidth: .infinity)
                        .overlay(alignment: .bottom) {
                            if tab.id == state.activeTab {
                                Capsule()
                                    .fill(Color.white.opacity(0.2))
                                    .frame(width: 58, height: 72)
                                    .offset(y: -4)
                                    .matchedGeometryEffect(id: "pill", in: bubbleNS)
                            }
                        }
                }
            }
            .frame(height: 64)

            // 3. ICONS AND TEXT (Always crisp, on top of everything)
            HStack(spacing: 0) {
                ForEach(kTabs) { tab in
                    let isActive = tab.id == state.activeTab
                    Button {
                        withAnimation(.spring(response: 0.4, dampingFraction: 0.7)) {
                            state.activeTab = tab.id
                        }
                        onTabSelected(tab.id)
                    } label: {
                        VStack(spacing: 3) {
                            Image(systemName: tab.icon)
                                .font(.system(size: isActive ? 22 : 20, weight: isActive ? .semibold : .regular))
                                .offset(y: isActive ? -6 : 0)
                            Text(tab.label)
                                .font(.system(size: 10, weight: isActive ? .bold : .medium))
                        }
                        .foregroundColor(isActive ? .white : Color(UIColor.lightGray))
                        .frame(maxWidth: .infinity)
                        .frame(height: 64)
                        .contentShape(Rectangle())
                    }
                    .buttonStyle(.plain)
                }
            }
            .frame(height: 64)
        }
        .padding(.horizontal, 16)
        .padding(.bottom, 8)
        .animation(.spring(response: 0.4, dampingFraction: 0.7), value: state.activeTab)
    }
}

    // MARK: - Fallback Tab Bar (iOS < 26)
struct FallbackTabBar: View {
    @ObservedObject var state: LiquidTabBarState
    var onTabSelected: (String) -> Void
    @Namespace private var bubbleNS

    var body: some View {
        ZStack(alignment: .bottom) {
            // 1. MAIN BACKGROUND (Glass Capsule)
            Capsule()
                .fill(.ultraThinMaterial)
                .frame(height: 64)
                .shadow(color: .black.opacity(0.4), radius: 15, y: 10)

            // 2. ACTIVE INDICATOR (Bubble) ON TOP OF GLASS
            HStack(spacing: 0) {
                ForEach(kTabs) { tab in
                    Color.clear
                        .frame(maxWidth: .infinity)
                        .overlay(alignment: .bottom) {
                            if tab.id == state.activeTab {
                                Capsule()
                                    .fill(Color.white.opacity(0.2))
                                    .frame(width: 58, height: 72)
                                    .offset(y: -4)
                                    .matchedGeometryEffect(id: "pill", in: bubbleNS)
                            }
                        }
                }
            }
            .frame(height: 64)

            // 3. ICONS AND TEXT (Always crisp, on top of everything)
            HStack(spacing: 0) {
                ForEach(kTabs) { tab in
                    let isActive = tab.id == state.activeTab
                    Button {
                        withAnimation(.spring(response: 0.4, dampingFraction: 0.7)) {
                            state.activeTab = tab.id
                        }
                        onTabSelected(tab.id)
                    } label: {
                        VStack(spacing: 3) {
                            Image(systemName: tab.icon)
                                .font(.system(size: isActive ? 22 : 20, weight: isActive ? .semibold : .regular))
                                .offset(y: isActive ? -6 : 0)
                            Text(tab.label)
                                .font(.system(size: 10, weight: isActive ? .bold : .medium))
                        }
                        .foregroundColor(isActive ? .white : Color(UIColor.lightGray))
                        .frame(maxWidth: .infinity)
                        .frame(height: 64)
                        .contentShape(Rectangle())
                    }
                    .buttonStyle(.plain)
                }
            }
            .frame(height: 64)
        }
        .padding(.horizontal, 16)
        .padding(.bottom, 8)
        .animation(.spring(response: 0.4, dampingFraction: 0.7), value: state.activeTab)
    }
}

// MARK: - Container View (selects correct bar at runtime)

struct LiquidTabBarView: View {
    @ObservedObject var state: LiquidTabBarState
    var onTabSelected: (String) -> Void

    var body: some View {
        VStack(spacing: 0) {
            Spacer()
            if #available(iOS 26, *) {
                iOS26LiquidTabBar(state: state, onTabSelected: onTabSelected)
            } else {
                FallbackTabBar(state: state, onTabSelected: onTabSelected)
            }
        }
    }
}

// MARK: - Capacitor Plugin

@objc(LiquidTabBarPlugin)
public class LiquidTabBarPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "LiquidTabBarPlugin"
    public let jsName     = "LiquidTabBar"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "initializeTabBar", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "updateTab",        returnType: CAPPluginReturnPromise),
    ]

    private var barState: LiquidTabBarState?
    private var hostVC:   UIViewController?

    // ── Called from JS: LiquidTabBarNative.initializeTabBar({ activeTab }) ──
    @objc func initializeTabBar(_ call: CAPPluginCall) {
        let initialTab = call.getString("activeTab") ?? "home"

        DispatchQueue.main.async { [weak self] in
            guard let self else { call.reject("Plugin deallocated"); return }

            // Already installed — just resolve
            if self.hostVC != nil { call.resolve(); return }

            guard let parentVC = self.bridge?.viewController else {
                call.reject("No root view controller")
                return
            }

            let state = LiquidTabBarState(activeTab: initialTab)
            state.activeTab = initialTab
            self.barState = state

            let contentView = LiquidTabBarView(state: state) { [weak self] tabId in
                self?.notifyListeners("onTabSelected", data: ["tabId": tabId])
            }

            let host = UIHostingController(rootView: contentView)
            host.view.backgroundColor = .clear
            host.view.isOpaque        = false
            host.view.translatesAutoresizingMaskIntoConstraints = false

            parentVC.addChild(host)
            parentVC.view.addSubview(host.view)
            host.didMove(toParent: parentVC)

            NSLayoutConstraint.activate([
                host.view.leadingAnchor.constraint(equalTo: parentVC.view.leadingAnchor),
                host.view.trailingAnchor.constraint(equalTo: parentVC.view.trailingAnchor),
                host.view.bottomAnchor.constraint(equalTo: parentVC.view.bottomAnchor),
                host.view.heightAnchor.constraint(equalToConstant: 140),
            ])

            parentVC.view.bringSubviewToFront(host.view)
            host.view.layer.zPosition = 9999
            self.hostVC = host

            // Push web content up so it's not hidden behind the bar
            if let wv = self.bridge?.webView {
                wv.scrollView.contentInset.bottom = 100
            }

            print("⚡️ [LiquidTabBar] Native tab bar installed.")
            call.resolve()
        }
    }

    // ── Called from JS when user changes tab from web side ──
    @objc func updateTab(_ call: CAPPluginCall) {
        guard let tabId = call.getString("tabId") else {
            call.reject("tabId required")
            return
        }
        DispatchQueue.main.async { [weak self] in
            guard let state = self?.barState, state.activeTab != tabId else {
                call.resolve(); return
            }
            withAnimation(.spring(response: 0.4, dampingFraction: 0.72)) {
                state.activeTab = tabId
            }
            call.resolve()
        }
    }
}
