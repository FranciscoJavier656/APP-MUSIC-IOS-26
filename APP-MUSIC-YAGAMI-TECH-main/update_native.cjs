const fs = require('fs');

// 1. Update YagamiDownloadManager.swift
let swiftCode = fs.readFileSync('ios/App/App/YagamiDownloadManager.swift', 'utf8');

const swiftMethod = `
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
`;

swiftCode = swiftCode.replace(/}\s*$/, swiftMethod);
fs.writeFileSync('ios/App/App/YagamiDownloadManager.swift', swiftCode);

// 2. Update YagamiDownloadManager_Register.m
let objcCode = fs.readFileSync('ios/App/App/YagamiDownloadManager_Register.m', 'utf8');
objcCode = objcCode.replace('CAP_PLUGIN_METHOD(downloadTrack, CAPPluginReturnPromise);', 'CAP_PLUGIN_METHOD(downloadTrack, CAPPluginReturnPromise);\n    CAP_PLUGIN_METHOD(getVibrantColor, CAPPluginReturnPromise);');
fs.writeFileSync('ios/App/App/YagamiDownloadManager_Register.m', objcCode);

console.log("Native iOS files updated successfully!");
