const fs = require('fs');

let swiftCode = fs.readFileSync('ios/App/App/QobuzAudioPlugin.swift', 'utf8');

const target = `                vc.view.addSubview(host.view)
                
                NSLayoutConstraint.activate([
                    host.view.leadingAnchor.constraint(equalTo: vc.view.leadingAnchor),
                    host.view.trailingAnchor.constraint(equalTo: vc.view.trailingAnchor),
                    host.view.bottomAnchor.constraint(equalTo: vc.view.bottomAnchor),
                    host.view.heightAnchor.constraint(equalToConstant: 140)
                ])
                
                host.view.layer.zPosition = 9999
                self.hostingController = host`;

const replacement = `                vc.addChild(host)
                vc.view.addSubview(host.view)
                
                NSLayoutConstraint.activate([
                    host.view.leadingAnchor.constraint(equalTo: vc.view.leadingAnchor),
                    host.view.trailingAnchor.constraint(equalTo: vc.view.trailingAnchor),
                    host.view.bottomAnchor.constraint(equalTo: vc.view.bottomAnchor),
                    host.view.heightAnchor.constraint(equalToConstant: 140)
                ])
                
                host.didMove(toParent: vc)
                
                // FORCE IT to front just in case
                vc.view.bringSubviewToFront(host.view)
                host.view.layer.zPosition = 9999
                self.hostingController = host`;

if(swiftCode.includes("vc.view.addSubview(host.view)")) {
    swiftCode = swiftCode.replace(target, replacement);
    fs.writeFileSync('ios/App/App/QobuzAudioPlugin.swift', swiftCode);
    console.log("Patched successfully!");
} else {
    console.log("Could not find target string.");
}
