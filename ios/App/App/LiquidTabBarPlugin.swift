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



@objc(ImageCachePlugin)
public class ImageCachePlugin: CAPPlugin {
    
    private let memoryCache = NSCache<NSString, UIImage>()
    private let diskCacheLimit: UInt64 = 200 * 1024 * 1024 // 200MB
    private let diskCacheTarget: UInt64 = 150 * 1024 * 1024 // 150MB target after eviction
    
    private var diskCacheDirectory: URL {
        let paths = FileManager.default.urls(for: .cachesDirectory, in: .userDomainMask)
        let cacheDir = paths[0].appendingPathComponent("ImageCache")
        if !FileManager.default.fileExists(atPath: cacheDir.path) {
            try? FileManager.default.createDirectory(at: cacheDir, withIntermediateDirectories: true, attributes: nil)
        }
        return cacheDir
    }
    
    override public func load() {
        memoryCache.totalCostLimit = 50 * 1024 * 1024 // 50MB
    }
    
    @objc func getCachedImageUrl(_ call: CAPPluginCall) {
        guard let urlString = call.getString("url"), let url = URL(string: urlString) else {
            call.reject("Must provide valid url")
            return
        }
        
        let maxSize = CGFloat(call.getInt("maxSize") ?? 600)
        let cacheKey = urlString.addingPercentEncoding(withAllowedCharacters: .alphanumerics) ?? UUID().uuidString
        let fileURL = diskCacheDirectory.appendingPathComponent(cacheKey + ".jpg")
        
        DispatchQueue.global(qos: .userInitiated).async { [weak self] in
            guard let self = self else { return }
            
            if FileManager.default.fileExists(atPath: fileURL.path) {
                // Update access date for LRU
                try? fileURL.setResourceValues({
                    var values = URLResourceValues()
                    values.contentAccessDate = Date()
                    return values
                }())
                
                DispatchQueue.main.async {
                    if let webUrl = self.bridge?.localURL(for: fileURL) {
                        call.resolve(["value": webUrl.absoluteString])
                    } else {
                        call.resolve(["value": fileURL.absoluteString])
                    }
                }
                return
            }
            
            do {
                let data = try Data(contentsOf: url)
                guard let image = UIImage(data: data) else {
                    DispatchQueue.main.async { call.reject("Failed to decode image") }
                    return
                }
                
                let resizedImage = self.resizeImage(image, maxSize: maxSize)
                
                guard let jpegData = resizedImage.jpegData(compressionQuality: 0.8) else {
                    DispatchQueue.main.async { call.reject("Failed to encode image") }
                    return
                }
                
                try jpegData.write(to: fileURL)
                
                self.memoryCache.setObject(resizedImage, forKey: cacheKey as NSString, cost: jpegData.count)
                
                self.enforceDiskCacheLimit()
                
                DispatchQueue.main.async {
                    if let webUrl = self.bridge?.localURL(for: fileURL) {
                        call.resolve(["value": webUrl.absoluteString])
                    } else {
                        call.resolve(["value": fileURL.absoluteString])
                    }
                }
                
            } catch {
                DispatchQueue.main.async { call.reject("Failed to download image: \(error.localizedDescription)") }
            }
        }
    }
    
    @objc func clearCache(_ call: CAPPluginCall) {
        DispatchQueue.global(qos: .background).async { [weak self] in
            guard let self = self else { return }
            
            self.memoryCache.removeAllObjects()
            
            do {
                let contents = try FileManager.default.contentsOfDirectory(at: self.diskCacheDirectory, includingPropertiesForKeys: nil)
                for fileUrl in contents {
                    try FileManager.default.removeItem(at: fileUrl)
                }
                DispatchQueue.main.async { call.resolve() }
            } catch {
                DispatchQueue.main.async { call.reject("Failed to clear disk cache: \(error.localizedDescription)") }
            }
        }
    }
    
    @objc func getCacheSize(_ call: CAPPluginCall) {
        DispatchQueue.global(qos: .background).async { [weak self] in
            guard let self = self else { return }
            
            do {
                let contents = try FileManager.default.contentsOfDirectory(at: self.diskCacheDirectory, includingPropertiesForKeys: [.fileSizeKey])
                var totalSize: UInt64 = 0
                for fileUrl in contents {
                    let resources = try fileUrl.resourceValues(forKeys: [.fileSizeKey])
                    if let fileSize = resources.fileSize {
                        totalSize += UInt64(fileSize)
                    }
                }
                DispatchQueue.main.async { call.resolve(["value": totalSize]) }
            } catch {
                DispatchQueue.main.async { call.reject("Failed to get cache size: \(error.localizedDescription)") }
            }
        }
    }
    
    private func resizeImage(_ image: UIImage, maxSize: CGFloat) -> UIImage {
        let size = image.size
        
        let widthRatio  = maxSize / size.width
        let heightRatio = maxSize / size.height
        
        if widthRatio >= 1 && heightRatio >= 1 {
            return image
        }
        
        let ratio = min(widthRatio, heightRatio)
        let newSize = CGSize(width: size.width * ratio, height: size.height * ratio)
        
        UIGraphicsBeginImageContextWithOptions(newSize, false, 1.0)
        image.draw(in: CGRect(origin: .zero, size: newSize))
        let newImage = UIGraphicsGetImageFromCurrentImageContext()
        UIGraphicsEndImageContext()
        
        return newImage ?? image
    }
    
    private func enforceDiskCacheLimit() {
        do {
            let contents = try FileManager.default.contentsOfDirectory(at: diskCacheDirectory, includingPropertiesForKeys: [.fileSizeKey, .contentAccessDateKey])
            
            var files: [(url: URL, size: UInt64, date: Date)] = []
            var totalSize: UInt64 = 0
            
            for fileUrl in contents {
                let resources = try fileUrl.resourceValues(forKeys: [.fileSizeKey, .contentAccessDateKey])
                let fileSize = UInt64(resources.fileSize ?? 0)
                let accessDate = resources.contentAccessDate ?? Date.distantPast
                
                files.append((url: fileUrl, size: fileSize, date: accessDate))
                totalSize += fileSize
            }
            
            if totalSize > diskCacheLimit {
                files.sort { $0.date < $1.date }
                
                for file in files {
                    try? FileManager.default.removeItem(at: file.url)
                    totalSize -= file.size
                    if totalSize <= diskCacheTarget {
                        break
                    }
                }
            }
        } catch {
            print("ImageCachePlugin: Failed to enforce disk cache limit")
        }
    }
}
