const fs = require('fs');
const path = 'ios/App/App/LiquidTabBarPlugin.swift';
let content = fs.readFileSync(path, 'utf8');

// We are going to replace BOTH iOS26TabBar and fallbackTabBar with a proper ZStack-based approach
const targetCode = `    // ─────────────────────────────────────────────
    // Fallback for iOS < 26: .ultraThinMaterial
    // ─────────────────────────────────────────────
    private var fallbackTabBar: some View {
        ZStack {
            // 1. The main bar background
            Capsule()
                .fill(.ultraThinMaterial)
                .frame(height: 64)
                .shadow(color: .black.opacity(0.4), radius: 15, y: 10)
            
            // 2. The active indicator (the bubble)
            HStack(spacing: 0) {
                ForEach(tabs, id: \\.0) { tab in
                    let isActive = state.activeTab == tab.0
                    if isActive {
                        Capsule()
                            .fill(Color.white.opacity(0.15))
                            .frame(width: 64, height: 88)
                            .offset(y: -12)
                            .matchedGeometryEffect(id: "activeBubble", in: tabBarNamespace)
                    } else {
                        Color.clear.frame(maxWidth: .infinity)
                    }
                }
            }
            .padding(.horizontal, 8)
            .frame(height: 64)

            // 3. The actual buttons (Icons and Text) sitting ON TOP
            HStack(spacing: 0) {
                ForEach(tabs, id: \\.0) { tab in
                    let isActive = state.activeTab == tab.0
                    Button {
                        onTabSelected(tab.0)
                        withAnimation(.spring(response: 0.4, dampingFraction: 0.7)) {
                            state.activeTab = tab.0
                        }
                    } label: {
                        VStack(spacing: 3) {
                            Image(systemName: tab.1)
                                .font(.system(size: isActive ? 22 : 20, weight: isActive ? .bold : .medium))
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
                }
            }
            .padding(.horizontal, 8)
            .frame(height: 64)
        }
        .padding(.horizontal, 16)
        .padding(.bottom, 8)
    }`;

// Replace the fallbackTabBar implementation
content = content.replace(/private var fallbackTabBar: some View \{[\s\S]*?\.padding\(\.bottom, 8\)\n    \}/, targetCode);

fs.writeFileSync(path, content);
console.log("Updated ZStack implementation in LiquidTabBarPlugin.swift");
