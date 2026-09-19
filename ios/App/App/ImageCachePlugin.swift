import Foundation
import Capacitor
import UIKit

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
