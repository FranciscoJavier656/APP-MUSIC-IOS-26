import Foundation
import Capacitor
import AVFoundation
import Accelerate
import MediaToolbox

@objc(QobuzAudioPlugin)
public class QobuzAudioPlugin: CAPPlugin {
    
    private var player: AVPlayer?
    private var isPlaying = false
    private var lastFftUpdate: TimeInterval = 0
    
    private let fftSize = 1024
    private lazy var log2n = vDSP_Length(log2(Float(fftSize)))
    private lazy var fftSetup = vDSP_create_fftsetup(log2n, FFTRadix(kFFTRadix2))
    
    @objc func play(_ call: CAPPluginCall) {
        guard let urlString = call.getString("url"), let url = URL(string: urlString) else {
            call.reject("URL de stream inválida")
            return
        }
        
        do {
            try AVAudioSession.sharedInstance().setCategory(.playback, mode: .default)
            try AVAudioSession.sharedInstance().setActive(true)
        } catch {
            print("Error configurando AVAudioSession: \(error)")
        }
        
        let asset = AVURLAsset(url: url)
        let playerItem = AVPlayerItem(asset: asset)
        
        var callbacks = MTAudioProcessingTapCallbacks(
            version: kMTAudioProcessingTapCallbacksVersion_0,
            clientInfo: UnsafeMutableRawPointer(Unmanaged.passUnretained(self).toOpaque()),
            `init`: { tap, clientInfo, tapStorageOut in
                tapStorageOut.pointee = clientInfo
            },
            finalize: { tap in },
            prepare: { tap, maxFrames, processingFormat in },
            unprepare: { tap in },
            process: { tap, numberFrames, flags, bufferListInOut, numberFramesOut, flagsOut in
                let status = MTAudioProcessingTapGetSourceAudio(tap, numberFrames, bufferListInOut, flagsOut, nil, numberFramesOut)
                if status == noErr {
                    if let storage = MTAudioProcessingTapGetStorage(tap) {
                        let plugin = Unmanaged<QobuzAudioPlugin>.fromOpaque(storage).takeUnretainedValue()
                        // Pasamos el puntero directo sin copiarlo al Swift Stack
                        plugin.processAudioForFFT(bufferList: bufferListInOut, frames: numberFrames)
                    }
                }
            }
        )
        
        // ¡LA SOLUCIÓN DE TU ARQUITECTO! Declaración directa sin Unmanaged
        var tap: MTAudioProcessingTap?
        
        let status = MTAudioProcessingTapCreate(
            kCFAllocatorDefault,
            &callbacks,
            MTAudioProcessingTapCreationFlags.postEffects, // Enum tipado correcto
            &tap
        )
        
        asset.loadValuesAsynchronously(forKeys: ["tracks"]) {
            var error: NSError? = nil
            let trackStatus = asset.statusOfValue(forKey: "tracks", error: &error)
            
            if trackStatus == .loaded {
                if status == noErr, let tapProcessor = tap {
                    if let audioTrack = asset.tracks(withMediaType: .audio).first {
                        let inputParams = AVMutableAudioMixInputParameters(track: audioTrack)
                        
                        // Asignación directa, sin necesidad de .takeRetainedValue()
                        inputParams.audioTapProcessor = tapProcessor
                        
                        let audioMix = AVMutableAudioMix()
                        audioMix.inputParameters = [inputParams]
                        playerItem.audioMix = audioMix
                    }
                }
            }
            
            DispatchQueue.main.async {
                self.player = AVPlayer(playerItem: playerItem)
                self.player?.play()
                self.isPlaying = true
                call.resolve()
            }
        }
    }
    
    func processAudioForFFT(bufferList: UnsafeMutablePointer<AudioBufferList>, frames: CMItemCount) {
        guard isPlaying else { return }
        
        let ablPointer = UnsafeMutableAudioBufferListPointer(bufferList)
        guard let buffer = ablPointer.first?.mData else { return }
        
        let floatPointer = buffer.bindMemory(to: Float.self, capacity: Int(frames))
        var floatArray = [Float](UnsafeBufferPointer(start: floatPointer, count: Int(frames)))
        
        let halfSize = fftSize / 2
        var magnitudes = [Float](repeating: 0.0, count: halfSize)
        var real = [Float](repeating: 0.0, count: halfSize)
        var imag = [Float](repeating: 0.0, count: halfSize)
        
        real.withUnsafeMutableBufferPointer { realPtr in
            imag.withUnsafeMutableBufferPointer { imagPtr in
                guard let realBase = realPtr.baseAddress, let imagBase = imagPtr.baseAddress else { return }
                var complex = DSPSplitComplex(realp: realBase, imagp: imagBase)
                
                var window = [Float](repeating: 0, count: Int(frames))
                vDSP_hann_window(&window, vDSP_Length(frames), Int32(vDSP_HANN_NORM))
                vDSP_vmul(floatArray, 1, window, 1, &floatArray, 1, vDSP_Length(frames))
                
                // Conversión de Memoria Segura Modernizada (Evita colapso por Strict Concurrency)
                floatArray.withUnsafeBufferPointer { floatBuffer in
                    if let baseAddr = floatBuffer.baseAddress {
                        baseAddr.withMemoryRebound(to: DSPComplex.self, capacity: halfSize) { complexPtr in
                            vDSP_ctoz(complexPtr, 2, &complex, 1, vDSP_Length(halfSize))
                        }
                    }
                }
                
                if let setup = fftSetup {
                    vDSP_fft_zrip(setup, &complex, 1, log2n, FFTDirection(FFT_FORWARD))
                    vDSP_zvmags(&complex, 1, &magnitudes, 1, vDSP_Length(halfSize))
                }
            }
        }
        
        var normalized = [Float](repeating: 0.0, count: halfSize)
        var multiplier: Float = 2.0 / Float(fftSize)
        vDSP_vsmul(magnitudes, 1, &multiplier, &normalized, 1, vDSP_Length(halfSize))
        
        let result = Array(normalized.prefix(64)).map { val -> Int in
            let scaled = val * 5.0
            return Int(min(max(scaled * 255.0, 0), 255))
        }
        
        let now = Date().timeIntervalSince1970
        if now - lastFftUpdate > 0.033 {
            self.lastFftUpdate = now
            DispatchQueue.main.async {
                self.notifyListeners("onFftData", data: ["data": result])
            }
        }
    }
    
    @objc func pause(_ call: CAPPluginCall) {
        DispatchQueue.main.async {
            self.player?.pause()
            self.isPlaying = false
            call.resolve()
        }
    }
    
    @objc func resume(_ call: CAPPluginCall) {
        DispatchQueue.main.async {
            self.player?.play()
            self.isPlaying = true
            call.resolve()
        }
    }
    
    @objc func seek(_ call: CAPPluginCall) {
        guard let time = call.getDouble("time") else {
            call.reject("Tiempo inválido")
            return
        }
        let targetTime = CMTime(seconds: time, preferredTimescale: 600)
        DispatchQueue.main.async {
            self.player?.seek(to: targetTime)
            call.resolve()
        }
    }
}