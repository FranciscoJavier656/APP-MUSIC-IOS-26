#!/usr/bin/perl
undef $/;
$_ = <>;

$replacement = <<'END_REPLACEMENT';
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
END_REPLACEMENT

s/        GlassEffectContainer \{\n            HStack\(spacing: 0\) \{.*?            \}\n            \.frame\(height: 64\)\n        \}/$replacement/s;
print;
