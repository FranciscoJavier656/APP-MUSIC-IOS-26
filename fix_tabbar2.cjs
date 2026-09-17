const fs = require('fs');
const path = 'ios/App/App/LiquidTabBarPlugin.swift';
let content = fs.readFileSync(path, 'utf8');

const targetCode2 = `    @available(iOS 26, *)
    private var iOS26TabBar: some View {
        GlassEffectContainer {
            ZStack {
                // Main bar glass
                Capsule()
                    .fill(.clear)
                    .frame(height: 64)
                    .glassEffect(.regular, in: .capsule)
                    .glassEffectUnion(id: "activeTab", namespace: tabBarNamespace)

                // Bubbles and content
                HStack(spacing: 0) {
                    ForEach(tabs, id: \\.0) { tab in
                        let isActive = state.activeTab == tab.0
                        Button {
                            onTabSelected(tab.0)
                            withAnimation(.spring(response: 0.45, dampingFraction: 0.7)) {
                                state.activeTab = tab.0
                            }
                        } label: {
                            VStack(spacing: 3) {
                                Image(systemName: tab.1)
                                    .font(.system(size: isActive ? 22 : 20, weight: isActive ? .bold : .medium))
                                    .symbolEffect(.bounce, value: isActive)
                                    .foregroundColor(isActive ? .white : Color(UIColor.lightGray))
                                Text(tab.2)
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
                                    .glassEffect(.regular, in: .capsule)
                                    .glassEffectUnion(id: "activeTab", namespace: tabBarNamespace)
                                    .matchedGeometryEffect(id: "activeBubble", in: tabBarNamespace)
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
    }`;

content = content.replace(/@available\(iOS 26, \*\)\n    private var iOS26TabBar: some View \{[\s\S]*?\.padding\(\.bottom, 8\)\n    \}/, targetCode2);

fs.writeFileSync(path, content);
console.log("Updated iOS 26 ZStack implementation");
