const fs = require('fs');
const newSwift = `import Foundation
import Capacitor
import UIKit

@objc(LiquidTabBarPlugin)
public class LiquidTabBarPlugin: CAPPlugin, UITabBarDelegate {
    private var tabBar: UITabBar?
    
    let tabMap: [(id: String, title: String, icon: String, selectedIcon: String)] = [
        ("home", "Inicio", "house", "house.fill"),
        ("search", "Buscar", "magnifyingglass", "magnifyingglass"),
        ("library", "Librería", "square.stack", "square.stack.fill"),
        ("downloads", "Descargas", "arrow.down.circle", "arrow.down.circle.fill"),
        ("settings", "Ajustes", "gearshape", "gearshape.fill")
    ]

    @objc func initializeTabBar(_ call: CAPPluginCall) {
        let initialTab = call.getString("activeTab") ?? "home"
        
        DispatchQueue.main.async {
            if self.tabBar == nil, let viewController = self.bridge?.viewController {
                let bar = UITabBar()
                bar.delegate = self
                bar.translatesAutoresizingMaskIntoConstraints = false
                
                // 100% NATIVE iOS TAB BAR (Same as WhatsApp, Instagram, Apple Music)
                if #available(iOS 15.0, *) {
                    let appearance = UITabBarAppearance()
                    appearance.configureWithDefaultBackground() // Standard iOS glass/blur
                    bar.standardAppearance = appearance
                    bar.scrollEdgeAppearance = appearance
                }
                
                var items: [UITabBarItem] = []
                var selectedItem: UITabBarItem? = nil
                
                for (index, tabInfo) in self.tabMap.enumerated() {
                    let item = UITabBarItem(
                        title: tabInfo.title,
                        image: UIImage(systemName: tabInfo.icon),
                        selectedImage: UIImage(systemName: tabInfo.selectedIcon)
                    )
                    item.tag = index
                    items.append(item)
                    
                    if tabInfo.id == initialTab {
                        selectedItem = item
                    }
                }
                
                bar.items = items
                bar.selectedItem = selectedItem
                
                viewController.view.addSubview(bar)
                
                NSLayoutConstraint.activate([
                    bar.leadingAnchor.constraint(equalTo: viewController.view.leadingAnchor),
                    bar.trailingAnchor.constraint(equalTo: viewController.view.trailingAnchor),
                    bar.bottomAnchor.constraint(equalTo: viewController.view.bottomAnchor)
                ])
                
                // Adjust webview padding so content doesn't get hidden behind the tab bar
                if let webView = self.bridge?.webView {
                    let bottomPadding = viewController.view.safeAreaInsets.bottom
                    let totalHeight = 49.0 + bottomPadding
                    webView.scrollView.contentInset = UIEdgeInsets(top: 0, left: 0, bottom: totalHeight, right: 0)
                }
                
                self.tabBar = bar
            }
            call.resolve()
        }
    }
    
    public func tabBar(_ tabBar: UITabBar, didSelect item: UITabBarItem) {
        let selectedTabId = tabMap[item.tag].id
        self.notifyListeners("onTabSelected", data: ["tabId": selectedTabId])
    }

    @objc func updateTab(_ call: CAPPluginCall) {
        guard let tabId = call.getString("tabId") else {
            call.reject("Must provide tabId")
            return
        }
        DispatchQueue.main.async {
            if let bar = self.tabBar, let index = self.tabMap.firstIndex(where: { $0.id == tabId }) {
                bar.selectedItem = bar.items?[index]
            }
            call.resolve()
        }
    }
}
`
fs.writeFileSync('ios/App/App/LiquidTabBarPlugin.swift', newSwift);
console.log("Written pure UIKit native TabBar!");
