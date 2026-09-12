const fs = require('fs');
const path = 'ios/App/App/LiquidTabBarPlugin.swift';
let content = fs.readFileSync(path, 'utf8');

const targetCode2 = `struct iOS26LiquidTabBar: View {
    @ObservedObject var state: LiquidTabBarState
    var onTabSelected: (String) -> Void
    @Namespace private var glassNS
    @Namespace private var bubbleNS

    var body: some View {
        GlassEffectContainer {
            ZStack {
                // Main bar glass
                Capsule()
                    .fill(.clear)
                    .frame(height: 64)
                    .glassEffect(.regular, in: Capsule())
                    .glassEffectUnion(id: "activeTab", namespace: glassNS)

                // Bubbles and content
                HStack(spacing: 0) {
                    ForEach(kTabs) { tab in
                        let isActive = state.activeTab == tab.id
                        Button {
                            onTabSelected(tab.id)
                            withAnimation(.spring(response: 0.45, dampingFraction: 0.7)) {
                                state.activeTab = tab.id
                            }
                        } label: {
                            VStack(spacing: 3) {
                                Image(systemName: tab.icon)
                                    .font(.system(size: isActive ? 22 : 20, weight: isActive ? .bold : .medium))
                                    .symbolEffect(.bounce, value: isActive)
                                    .foregroundColor(isActive ? .white : Color(UIColor.lightGray))
                                Text(tab.label)
                                    .font(.system(size: 10, weight: isActive ? .bold : .medium))
                                    .foregroundColor(isActive ? .white : Color(UIColor.lightGray))
                                    .lineLimit(1)
                                    .minimumScaleFactor(0.8)
                            }
                            .frame(maxWidth: .infinity)
                            .frame(height: 64)
                            .contentShape(Rectangle())
                        }
                        .buttonStyle(.plain)
                        .background {
                            if isActive {
                                Capsule()
                                    .fill(.clear)
                                    .frame(width: 64, height: 88)
                                    .offset(y: -12)
                                    .glassEffect(.regular, in: Capsule())
                                    .glassEffectUnion(id: "activeTab", namespace: glassNS)
                                    .matchedGeometryEffect(id: "activeBubble", in: bubbleNS)
                            }
                        }
                    }
                }
                .padding(.horizontal, 8)
                .frame(height: 64)
            }
        }
        .padding(.horizontal, 16)
        .padding(.bottom, 8)
    }
}`;

content = content.replace(/@available\(iOS 26, \*\)\s+@available\(iOS 26, \*\)\s+private var iOS26TabBar: some View \{[\s\S]*?\.padding\(\.bottom, 8\)\n    \}/, targetCode2);
content = content.replace(/iOS26TabBar/, 'iOS26LiquidTabBar(state: state, onTabSelected: onTabSelected)');

fs.writeFileSync(path, content);
console.log("Fixed iOS26TabBar to struct");
