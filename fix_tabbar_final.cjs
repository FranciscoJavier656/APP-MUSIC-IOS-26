const fs = require('fs');
const path = 'ios/App/App/LiquidTabBarPlugin.swift';
let content = fs.readFileSync(path, 'utf8');

// The active tab bubble needs to be ON TOP of the main bar background, but BEHIND the text/icons.
// In the original code, the active bubble was behind the glass effect, making it blurry.

// Let's replace the FallbackTabBar
const fallbackCode = `// MARK: - Fallback Tab Bar (iOS < 26)
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
}`;

// Let's replace the iOS26TabBar
const ios26Code = `struct iOS26LiquidTabBar: View {
    @ObservedObject var state: LiquidTabBarState
    var onTabSelected: (String) -> Void
    @Namespace private var glassNS
    @Namespace private var bubbleNS

    var body: some View {
        GlassEffectContainer {
            ZStack(alignment: .bottom) {
                // 1. MAIN BACKGROUND
                Capsule()
                    .fill(.clear)
                    .frame(height: 64)
                    .glassEffect(.regular.interactive(), in: Capsule())
                    .glassEffectUnion(id: "liquid", namespace: glassNS)

                // 2. ACTIVE BUBBLE
                HStack(spacing: 0) {
                    ForEach(kTabs) { tab in
                        Color.clear
                            .frame(maxWidth: .infinity)
                            .overlay(alignment: .bottom) {
                                if tab.id == state.activeTab {
                                    Circle()
                                        .frame(width: 60, height: 60)
                                        .glassEffect(.regular.interactive(), in: Circle())
                                        .glassEffectUnion(id: "liquid", namespace: glassNS)
                                        .matchedGeometryEffect(id: "bubble", in: bubbleNS)
                                        .offset(y: -10)
                                }
                            }
                    }
                }
                .frame(height: 64)

                // 3. ICONS AND TEXT
                HStack(spacing: 0) {
                    ForEach(kTabs) { tab in
                        let isActive = tab.id == state.activeTab
                        Button {
                            withAnimation(.spring(response: 0.4, dampingFraction: 0.72)) {
                                state.activeTab = tab.id
                            }
                            onTabSelected(tab.id)
                        } label: {
                            VStack(spacing: 3) {
                                Image(systemName: tab.icon)
                                    .font(.system(size: isActive ? 23 : 20, weight: isActive ? .semibold : .regular))
                                    .symbolEffect(.bounce, value: isActive)
                                    .offset(y: isActive ? -8 : 0)
                                    .animation(.spring(response: 0.35, dampingFraction: 0.65), value: isActive)
                                Text(tab.label)
                                    .font(.system(size: 10, weight: isActive ? .bold : .medium))
                            }
                            .foregroundStyle(isActive ? Color.white : Color(UIColor.lightGray))
                            .frame(maxWidth: .infinity)
                            .frame(height: 64)
                            .contentShape(Rectangle())
                        }
                        .buttonStyle(.plain)
                    }
                }
                .frame(height: 64)
            }
        }
        .padding(.horizontal, 16)
        .padding(.bottom, 8)
        .animation(.spring(response: 0.4, dampingFraction: 0.72), value: state.activeTab)
    }
}`;

content = content.replace(/\/\/ MARK: - Fallback Tab Bar \(iOS < 26\)[\s\S]*?\}\n\}/, fallbackCode);
content = content.replace(/struct iOS26LiquidTabBar: View \{[\s\S]*?\.animation\(\.spring\(response: 0\.4, dampingFraction: 0\.72\), value: state\.activeTab\)\n    \}\n\}/, ios26Code);

fs.writeFileSync(path, content);
console.log("Updated both TabBars with proper ZStack rendering");
