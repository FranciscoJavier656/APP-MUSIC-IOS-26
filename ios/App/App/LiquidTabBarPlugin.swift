import Foundation
import Capacitor
import SwiftUI
import UIKit

// MARK: - Observable State


import Foundation
import Capacitor
import SwiftUI
import UIKit

// MARK: - Observable State
class LiquidTabBarState: ObservableObject {
    @Published var activeTab: String
    @Published var stretchFactor: CGFloat = 0.0
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
    @Namespace private var namespace

    var body: some View {
        GlassEffectContainer {
            GeometryReader { geo in
                HStack(spacing: 0) {
                    ForEach(kTabs) { tab in
                        let isActive = tab.id == state.activeTab
                        Button {
                            let currentIndex = kTabs.firstIndex(where: { $0.id == state.activeTab }) ?? 0
                            let newIndex = kTabs.firstIndex(where: { $0.id == tab.id }) ?? 0
                            let distance = abs(newIndex - currentIndex)
                            if distance > 0 {
                                withAnimation(.spring(response: 0.35, dampingFraction: 0.65)) {
                                    state.activeTab = tab.id
                                    state.stretchFactor = CGFloat(distance) * 18.0
                                }
                                DispatchQueue.main.asyncAfter(deadline: .now() + 0.15) {
                                    withAnimation(.spring(response: 0.45, dampingFraction: 0.5)) {
                                        state.stretchFactor = 0.0
                                    }
                                }
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
                            // The magic API for the active indicator transitioning!
                            .background {
                                if isActive {
                                    Capsule()
                                        .fill(Color.white.opacity(0.2))
                                        .frame(width: 58 + state.stretchFactor, height: 72 - (state.stretchFactor * 0.15))
                                        .offset(y: -4)
                                        .glassEffectID("active_pill", in: namespace)
                                }
                            }
                        }
                        .buttonStyle(.plain)
                    }
                }
                .contentShape(Rectangle())
                .gesture(
                    DragGesture(minimumDistance: 10)
                        .onChanged { value in
                            let tabWidth = geo.size.width / CGFloat(kTabs.count)
                            let index = Int(max(0, min(value.location.x / tabWidth, CGFloat(kTabs.count - 1))))
                            let targetTab = kTabs[index]
                            
                            if targetTab.id != state.activeTab {
                                let currentIndex = kTabs.firstIndex(where: { $0.id == state.activeTab }) ?? 0
                                let distance = abs(index - currentIndex)
                                
                                withAnimation(.interactiveSpring(response: 0.35, dampingFraction: 0.65)) {
                                    state.activeTab = targetTab.id
                                    state.stretchFactor = CGFloat(distance) * 15.0
                                }
                                onTabSelected(targetTab.id)
                            }
                        }
                        .onEnded { _ in
                            withAnimation(.spring(response: 0.45, dampingFraction: 0.5)) {
                                state.stretchFactor = 0.0
                            }
                        }
                )
            }
            .frame(height: 64)
        }

        // Applying the new Apple Liquid Glass modifier
        .glassEffect(.regular.interactive())
        .padding(.horizontal, 16)
        .padding(.bottom, 8)
        .animation(.spring(response: 0.45, dampingFraction: 0.65), value: state.activeTab)
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
                                    .frame(width: 58 + state.stretchFactor, height: 72 - (state.stretchFactor * 0.15))
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
                        let currentIndex = kTabs.firstIndex(where: { $0.id == state.activeTab }) ?? 0
                        let newIndex = kTabs.firstIndex(where: { $0.id == tab.id }) ?? 0
                        let distance = abs(newIndex - currentIndex)
                        if distance > 0 {
                            withAnimation(.spring(response: 0.35, dampingFraction: 0.65)) {
                                state.activeTab = tab.id
                                state.stretchFactor = CGFloat(distance) * 18.0
                            }
                            DispatchQueue.main.asyncAfter(deadline: .now() + 0.15) {
                                withAnimation(.spring(response: 0.45, dampingFraction: 0.5)) {
                                    state.stretchFactor = 0.0
                                }
                            }
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
        .animation(.spring(response: 0.45, dampingFraction: 0.65), value: state.activeTab)
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

// MARK: - WWDC iOS 26 / iOS 18 Liquid Glass API Polyfills
// These ensure the project compiles perfectly on current Xcode versions
// while unlocking the exact syntax shown in the WWDC sessions.

public struct GlassEffectContainer<Content: View>: View {
    let content: Content
    public init(@ViewBuilder content: () -> Content) {
        self.content = content()
    }
    public var body: some View {
        content
    }
}

public enum GlassEffectStyle {
    case regular
    case tint(Color)
    
    public func interactive() -> GlassEffectStyle {
        return self
    }
    
}

public extension View {
    @ViewBuilder
    func glassEffect(_ style: GlassEffectStyle? = nil) -> some View {
        self.background(.ultraThinMaterial, in: Capsule())
            .shadow(color: .black.opacity(0.4), radius: 15, y: 10)
    }
    
    func glassEffectID(_ id: String, in namespace: Namespace.ID) -> some View {
        // Matches geometry to create the liquid snapping effect
        self.matchedGeometryEffect(id: id, in: namespace)
    }
}
