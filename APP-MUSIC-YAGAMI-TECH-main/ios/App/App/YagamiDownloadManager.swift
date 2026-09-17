import Foundation
import UIKit
import Capacitor
import AVFoundation

@objc(YagamiDownloadManager)
public class YagamiDownloadManager: CAPPlugin, URLSessionDownloadDelegate {
    
    private var downloadSession: URLSession!
    private var activeDownloads: [Int: String] = [:] // TaskID -> TrackID
    
    override public func load() {
        // Use default configuration instead of background to avoid background session conflicts during hot reloads
        let config = URLSessionConfiguration.default
        self.downloadSession = URLSession(configuration: config, delegate: self, delegateQueue: nil)
    }
    
    @objc func downloadTrack(_ call: CAPPluginCall) {
        guard let urlString = call.getString("url"),
              let url = URL(string: urlString),
              let trackId = call.getString("trackId") else {
            call.reject("Must provide url and trackId")
            return
        }
        
        let format = call.getString("format") ?? "flac"
        let downloadTask = downloadSession.downloadTask(with: url)
        
        let metadata = [
            "title": call.getString("title") ?? "Unknown",
            "artist": call.getString("artist") ?? "Unknown",
            "album": call.getString("album") ?? "Unknown",
            "artworkUrl": call.getString("artworkUrl") ?? "",
            "trackId": trackId,
            "format": format
        ]
        
        if let metadataData = try? JSONSerialization.data(withJSONObject: metadata),
           let metadataString = String(data: metadataData, encoding: .utf8) {
            downloadTask.taskDescription = metadataString
        }
        
        activeDownloads[downloadTask.taskIdentifier] = trackId
        downloadTask.resume()
        
        self.notifyListeners("onDownloadStarted", data: ["trackId": trackId])
        
        call.resolve([
            "status": "queued",
            "trackId": trackId
        ])
    }
    
    public func urlSession(_ session: URLSession, downloadTask: URLSessionDownloadTask, didWriteData bytesWritten: Int64, totalBytesWritten: Int64, totalBytesExpectedToWrite: Int64) {
        guard let trackId = activeDownloads[downloadTask.taskIdentifier] else { return }
        
        var progress: Double = 0.0
        if totalBytesExpectedToWrite > 0 {
            progress = Double(totalBytesWritten) / Double(totalBytesExpectedToWrite)
        } else {
            progress = min(Double(totalBytesWritten) / 35_000_000.0, 0.95)
        }
        
        self.notifyListeners("onDownloadProgress", data: [
            "trackId": trackId,
            "progress": progress
        ])
    }
    
    public func urlSession(_ session: URLSession, downloadTask: URLSessionDownloadTask, didFinishDownloadingTo location: URL) {
        guard let description = downloadTask.taskDescription,
              let data = description.data(using: .utf8),
              let metadata = try? JSONSerialization.jsonObject(with: data) as? [String: String],
              let trackId = metadata["trackId"],
              let format = metadata["format"] else { return }
              
        let fileManager = FileManager.default
        let appSupportDir = fileManager.urls(for: .applicationSupportDirectory, in: .userDomainMask).first!
        let downloadsDir = appSupportDir.appendingPathComponent("Downloads")
        
        if !fileManager.fileExists(atPath: downloadsDir.path) {
            try? fileManager.createDirectory(at: downloadsDir, withIntermediateDirectories: true)
        }
        
        let destinationURL = downloadsDir.appendingPathComponent("\(trackId).\(format)")
        
        do {
            if fileManager.fileExists(atPath: destinationURL.path) {
                try fileManager.removeItem(at: destinationURL)
            }
            try fileManager.moveItem(at: location, to: destinationURL)
            
            self.notifyListeners("onDownloadStateChange", data: ["trackId": trackId, "status": "processing_metadata"])
            
            DispatchQueue.global().asyncAfter(deadline: .now() + 1.2) {
                self.notifyListeners("onDownloadStateChange", data: ["trackId": trackId, "status": "importing_library"])
                
                DispatchQueue.global().asyncAfter(deadline: .now() + 1.0) {
                    self.notifyListeners("onDownloadStateChange", data: ["trackId": trackId, "status": "organizing"])
                    
                    DispatchQueue.global().asyncAfter(deadline: .now() + 0.8) {
                        self.notifyListeners("onDownloadCompleted", data: [
                            "trackId": trackId,
                            "path": destinationURL.path
                        ])
                    }
                }
            }
        } catch {
            self.notifyListeners("onDownloadError", data: [
                "trackId": trackId,
                "error": error.localizedDescription
            ])
        }
        activeDownloads.removeValue(forKey: downloadTask.taskIdentifier)
    }
    
    public func urlSession(_ session: URLSession, task: URLSessionTask, didCompleteWithError error: Error?) {
        if let error = error {
            if let trackId = activeDownloads[task.taskIdentifier] {
                self.notifyListeners("onDownloadError", data: [
                    "trackId": trackId,
                    "error": error.localizedDescription
                ])
                activeDownloads.removeValue(forKey: task.taskIdentifier)
            }
        }
    }

    @objc func getVibrantColor(_ call: CAPPluginCall) {
        guard let urlString = call.getString("url"),
              let url = URL(string: urlString) else {
            call.reject("Must provide url")
            return
        }
        
        DispatchQueue.global(qos: .userInitiated).async {
            do {
                let data = try Data(contentsOf: url)
                guard let image = UIImage(data: data),
                      let cgImage = image.cgImage else {
                    call.reject("Invalid image")
                    return
                }
                
                // 1x1 resize to get average color quickly (iOS hardware accelerated)
                let colorSpace = CGColorSpaceCreateDeviceRGB()
                var bitmap = [UInt8](repeating: 0, count: 4)
                guard let context = CGContext(data: &bitmap, width: 1, height: 1, bitsPerComponent: 8, bytesPerRow: 4, space: colorSpace, bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue) else {
                    call.reject("Cannot create context")
                    return
                }
                
                context.draw(cgImage, in: CGRect(x: 0, y: 0, width: 1, height: 1))
                
                let r = CGFloat(bitmap[0]) / 255.0
                let g = CGFloat(bitmap[1]) / 255.0
                let b = CGFloat(bitmap[2]) / 255.0
                
                let color = UIColor(red: r, green: g, blue: b, alpha: 1.0)
                
                var hue: CGFloat = 0
                var saturation: CGFloat = 0
                var brightness: CGFloat = 0
                var alpha: CGFloat = 0
                
                if color.getHue(&hue, saturation: &saturation, brightness: &brightness, alpha: &alpha) {
                    // Apple's Dynamic Island vibrant rule: boost saturation aggressively, enforce minimum brightness
                    let vibrantSat = min(saturation * 1.6, 1.0)
                    let vibrantBri = max(min(brightness * 1.3, 1.0), 0.4) 
                    
                    let vibrantColor = UIColor(hue: hue, saturation: vibrantSat, brightness: vibrantBri, alpha: 1.0)
                    
                    var r2: CGFloat = 0
                    var g2: CGFloat = 0
                    var b2: CGFloat = 0
                    var a2: CGFloat = 0
                    vibrantColor.getRed(&r2, green: &g2, blue: &b2, alpha: &a2)
                    
                    let hexString = String(format: "#%02X%02X%02X", Int(round(r2 * 255.0)), Int(round(g2 * 255.0)), Int(round(b2 * 255.0)))
                    
                    call.resolve(["color": hexString])
                } else {
                    call.reject("Could not parse color")
                }
            } catch {
                call.reject("Could not load image")
            }
        }
    }
}
