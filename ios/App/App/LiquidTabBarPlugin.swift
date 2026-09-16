import Foundation
import Capacitor

@objc(LiquidTabBarPlugin)
public class LiquidTabBarPlugin: CAPPlugin {
    
    /// Show or hide the native tab bar
    @objc func setHidden(_ call: CAPPluginCall) {
        let isHidden = call.getBool("hidden") ?? false
        
        DispatchQueue.main.async {
            NotificationCenter.default.post(
                name: NSNotification.Name("ToggleTabBar"),
                object: nil,
                userInfo: ["hidden": isHidden]
            )
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

