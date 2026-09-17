import Foundation
import Capacitor

@objc(LiquidTabBarPlugin)
public class LiquidTabBarPlugin: CAPPlugin {
    
    /// Show or hide the native tab bar
    private func forceHideUIKitTabBar(hidden: Bool) {
        DispatchQueue.main.async {
            guard let windowScene = UIApplication.shared.connectedScenes.first as? UIWindowScene,
                  let window = windowScene.windows.first else { return }
            
            func traverse(view: UIView) {
                let typeName = String(describing: type(of: view))
                // iOS 26 Liquid Glass uses _UIFluidTabBar or similar classes.
                if typeName.contains("TabBar") || typeName.contains("Fluid") || typeName.contains("Accessory") {
                    // Do NOT hide the main Capacitor view or the root hosting view.
                    // But DO hide internal hosting views inside the tab bar hierarchy!
                    if !typeName.contains("CAPBridge") && !typeName.contains("WKWebView") && !typeName.contains("HybridRoot") {
                        // If it's a structural view, hiding it is safe.
                        // We check for specific internal iOS 26 names.
                        if typeName.contains("_UIFluid") || typeName.contains("UITabBar") || typeName.contains("BottomAccessory") || typeName.contains("TabBar") {
                            view.isHidden = hidden
                            view.alpha = hidden ? 0 : 1
                            view.isUserInteractionEnabled = !hidden
                        }
                    }
                }
                for subview in view.subviews {
                    traverse(view: subview)
                }
            }
            traverse(view: window)
        }
    }

    /// Show or hide the native tab bar
    @objc func setHidden(_ call: CAPPluginCall) {
        let isHidden = call.getBool("hidden") ?? false
        forceHideUIKitTabBar(hidden: isHidden)
        DispatchQueue.main.async {
            NotificationCenter.default.post(name: NSNotification.Name("ToggleTabBar"), object: nil, userInfo: ["hidden": isHidden])
        }
        call.resolve()
    }

    @objc func hide(_ call: CAPPluginCall) {
        forceHideUIKitTabBar(hidden: true)
        DispatchQueue.main.async {
            NotificationCenter.default.post(name: NSNotification.Name("ToggleTabBar"), object: nil, userInfo: ["hidden": true])
        }
        call.resolve()
    }

    @objc func show(_ call: CAPPluginCall) {
        forceHideUIKitTabBar(hidden: false)
        DispatchQueue.main.async {
            NotificationCenter.default.post(name: NSNotification.Name("ToggleTabBar"), object: nil, userInfo: ["hidden": false])
        }
        call.resolve()
    }
    
    /// Initialize the native tab bar (called from React on app ready)
    @objc func initializeTabBar(_ call: CAPPluginCall) {
        let activeTab = call.getString("activeTab") ?? "home"
        
        DispatchQueue.main.async {
            // Show the tab bar
            NotificationCenter.default.post(
                name: NSNotification.Name("ToggleTabBar"),
                object: nil,
                userInfo: ["hidden": false]
            )
            
            // Select the initial tab
            NotificationCenter.default.post(
                name: NSNotification.Name("SelectTab"),
                object: nil,
                userInfo: ["tabId": activeTab]
            )
        }
        
        call.resolve(["success": true])
    }
    
    /// Update the active tab from JavaScript
    @objc func updateTab(_ call: CAPPluginCall) {
        guard let tabId = call.getString("tabId") else {
            call.reject("Missing tabId")
            return
        }
        
        DispatchQueue.main.async {
            NotificationCenter.default.post(
                name: NSNotification.Name("SelectTab"),
                object: nil,
                userInfo: ["tabId": tabId]
            )
        }
        
        call.resolve()
    }
    
    /// Update the now playing info for the native bottom accessory (iOS 26+)
    @objc func updateNowPlaying(_ call: CAPPluginCall) {
        let title = call.getString("title") ?? ""
        let artist = call.getString("artist") ?? ""
        let isPlaying = call.getBool("isPlaying") ?? false
        let hasTrack = call.getBool("hasTrack") ?? false
        
        DispatchQueue.main.async {
            NotificationCenter.default.post(
                name: NSNotification.Name("UpdateNowPlaying"),
                object: nil,
                userInfo: [
                    "title": title,
                    "artist": artist,
                    "isPlaying": isPlaying,
                    "hasTrack": hasTrack
                ]
            )
        }
        
        call.resolve()
    }
    
    /// Update the download badge count on the Downloads tab
    @objc func updateBadge(_ call: CAPPluginCall) {
        let count = call.getInt("count") ?? 0
        
        DispatchQueue.main.async {
            NotificationCenter.default.post(
                name: NSNotification.Name("UpdateDownloadBadge"),
                object: nil,
                userInfo: ["count": count]
            )
        }
        
        call.resolve()
    }
}

