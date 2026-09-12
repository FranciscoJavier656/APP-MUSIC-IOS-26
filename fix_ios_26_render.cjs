const fs = require('fs');
const path = 'ios/App/App/LiquidTabBarPlugin.swift';
let content = fs.readFileSync(path, 'utf8');

// I see the problem in the screenshot. It's rendering a HUGE transparent oval (the LiquidTabBar) overlapping the MiniPlayer.
// And it's rendering TWO tab bars! The native one AND the React one, OR the native one has a huge black background.
// Wait, looking closely at the image:
// 1. The native tab bar is rendering, but its background is completely transparent to the React app underneath.
// 2. We can see "Inicio" and "Buscar" from the React app overlapping the native bar.
// This means `useNativeTabBar` in React is likely false (or it didn't hide the React bar), 
// OR the React bar is still there because it's rendering underneath!
// Wait! I look at the image again...
// The background of the native tab bar is actually completely black/dark grey, and it's rendering DOUBLE text.
// No, it's not double text. It's the native SwiftUI bar rendering its own text, but the `GlassEffectContainer` is completely messing up the rendering.
// Let's go back to a simple, guaranteed working ZStack for iOS 26 that we KNOW works.

const ios26Code = `@available(iOS 26, *)
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
}`;

const regex = /@available\(iOS 26, \*\)\s*struct iOS26LiquidTabBar: View \{[\s\S]*?\}\n\}\n\n    \/\/ MARK: - Fallback Tab Bar/g;

content = content.replace(regex, ios26Code + '\n\n    // MARK: - Fallback Tab Bar');

fs.writeFileSync(path, content);
console.log("Reverted iOS26TabBar to reliable ZStack");
