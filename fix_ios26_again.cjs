const fs = require('fs');
const path = 'ios/App/App/LiquidTabBarPlugin.swift';
let content = fs.readFileSync(path, 'utf8');

const ios26Code = `@available(iOS 26, *)
struct iOS26LiquidTabBar: View {
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

// I will just substring replace from struct iOS26LiquidTabBar to the end of the struct
const regex = /struct iOS26LiquidTabBar: View \{[\s\S]*?\}\n\}\n\}\n\}?/g;

content = content.replace(regex, ios26Code + '\n');
// Also clean up any extra closing braces if they are left
content = content.replace(/\n\}\n\}\n\}\n    \/\/ MARK: - Fallback Tab Bar/, '\n    // MARK: - Fallback Tab Bar');

fs.writeFileSync(path, content);
console.log("Updated iOS26TabBar");
