import UIKit
import SwiftUI

struct RealNativeTabBar: UIViewRepresentable {
    @Binding var selectedTab: String
    
    func makeUIView(context: Context) -> UITabBar {
        let tabBar = UITabBar()
        let appearance = UITabBarAppearance()
        appearance.configureWithDefaultBackground()
        tabBar.standardAppearance = appearance
        return tabBar
    }
    
    func updateUIView(_ uiView: UITabBar, context: Context) {}
}
