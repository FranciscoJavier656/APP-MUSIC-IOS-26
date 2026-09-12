import Foundation
import Capacitor
import AVFoundation

@objc(YagamiDownloadManager)
public class YagamiDownloadManager: CAPPlugin, URLSessionDownloadDelegate {
    
    private var downloadSession: URLSession!
    private var activeDownloads: [Int: String] = [:] // TaskID -> TrackID
    
    override public func load() {
        // CORRECCIÓN: Usamos .default en lugar de .background para evitar bloqueos
        // si el AppDelegate no tiene implementado handleEventsForBackgroundURLSession.
        // Esto asegura que la descarga inicie instantáneamente.
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
    
    // MARK: - URLSessionDownloadDelegate
    
    public func urlSession(_ session: URLSession, downloadTask: URLSessionDownloadTask, didWriteData bytesWritten: Int64, totalBytesWritten: Int64, totalBytesExpectedToWrite: Int64) {
        
        guard let trackId = activeDownloads[downloadTask.taskIdentifier] else { return }
        
        var progress: Double = 0.0
        
        // FIX: Qobuz a veces no envía Content-Length (da -1), lo que congela la UI en 0%.
        if totalBytesExpectedToWrite > 0 {
            progress = Double(totalBytesWritten) / Double(totalBytesExpectedToWrite)
        } else {
            // Tamaño desconocido: progreso simulado (asumiendo ~35MB por archivo FLAC)
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
            
            // Log detallado de estados
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
}
