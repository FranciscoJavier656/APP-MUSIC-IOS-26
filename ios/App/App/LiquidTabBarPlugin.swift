import Foundation
import Capacitor

@objc(LiquidTabBarPlugin)
public class LiquidTabBarPlugin: CAPPlugin {
    
    @objc func setHidden(_ call: CAPPluginCall) {
        let isHidden = call.getBool("hidden") ?? false
        
        DispatchQueue.main.async {
            // Post a notification that our SwiftUI HybridRootView will intercept
            NotificationCenter.default.post(
                name: NSNotification.Name("ToggleTabBar"),
                object: nil,
                userInfo: ["hidden": isHidden]
            )
        }
        
        call.resolve()
    }
}
