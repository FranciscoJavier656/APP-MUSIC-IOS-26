const fs = require('fs');
const path = 'ios/App/App/LiquidTabBarPlugin.swift';
let content = fs.readFileSync(path, 'utf8');

const targetCode = `    // MARK: - Fallback Tab Bar (iOS < 26)
struct FallbackTabBar: View {
    @ObservedObject var state: LiquidTabBarState
    var onTabSelected: (String) -> Void
    @Namespace private var bubbleNS

    var body: some View {
        ZStack {
            // 1. The main bar background
            Capsule()
                .fill(.ultraThinMaterial)
                .frame(height: 64)
                .shadow(color: .black.opacity(0.4), radius: 15, y: 10)
            
            // 2. The active indicator (the bubble)
            HStack(spacing: 0) {
                ForEach(kTabs) { tab in
                    let isActive = state.activeTab == tab.id
                    if isActive {
                        Capsule()
                            .fill(Color.white.opacity(0.15))
                            .frame(width: 64, height: 88)
                            .offset(y: -12)
                            .matchedGeometryEffect(id: "activeBubble", in: bubbleNS)
                    } else {
                        Color.clear.frame(maxWidth: .infinity)
                    }
                }
            }
            .padding(.horizontal, 8)
            .frame(height: 64)

            // 3. The actual buttons (Icons and Text) sitting ON TOP
            HStack(spacing: 0) {
                ForEach(kTabs) { tab in
                    let isActive = state.activeTab == tab.id
                    Button {
                        onTabSelected(tab.id)
                        withAnimation(.spring(response: 0.4, dampingFraction: 0.7)) {
                            state.activeTab = tab.id
                        }
                    } label: {
                        VStack(spacing: 3) {
                            Image(systemName: tab.icon)
                                .font(.system(size: isActive ? 22 : 20, weight: isActive ? .bold : .medium))
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
                }
            }
            .padding(.horizontal, 8)
            .frame(height: 64)
        }
        .padding(.horizontal, 16)
        .padding(.bottom, 8)
    }
}`;

content = content.replace(/\/\/ MARK: - Fallback Tab Bar \(iOS < 26\)[\s\S]*?\.animation\(\.spring\(response: 0\.4, dampingFraction: 0\.7\), value: state\.activeTab\)\n    \}\n\}/, targetCode);

fs.writeFileSync(path, content);
console.log("Updated FallbackTabBar");
