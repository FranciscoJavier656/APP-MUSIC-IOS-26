const fs = require('fs');
let code = fs.readFileSync('ios/App/App/LiquidTabBarPlugin.swift', 'utf8');

const target = `                if let webView = self.bridge?.webView, let parent = webView.superview {
                    host.view.translatesAutoresizingMaskIntoConstraints = false
                    parent.addSubview(host.view)
                    NSLayoutConstraint.activate([
                        host.view.leadingAnchor.constraint(equalTo: parent.leadingAnchor),
                        host.view.trailingAnchor.constraint(equalTo: parent.trailingAnchor),
                        host.view.bottomAnchor.constraint(equalTo: parent.bottomAnchor),
                        host.view.heightAnchor.constraint(equalToConstant: 160)
                    ])
                    self.hostingController = host
                }`;

const replacement = `                if let viewController = self.bridge?.viewController {
                    host.view.translatesAutoresizingMaskIntoConstraints = false
                    viewController.view.addSubview(host.view)
                    viewController.addChild(host)
                    
                    NSLayoutConstraint.activate([
                        host.view.leadingAnchor.constraint(equalTo: viewController.view.leadingAnchor),
                        host.view.trailingAnchor.constraint(equalTo: viewController.view.trailingAnchor),
                        host.view.bottomAnchor.constraint(equalTo: viewController.view.bottomAnchor),
                        host.view.heightAnchor.constraint(equalToConstant: 160)
                    ])
                    
                    host.didMove(toParent: viewController)
                    self.hostingController = host
                }`;

code = code.replace(target, replacement);

fs.writeFileSync('ios/App/App/LiquidTabBarPlugin.swift', code);
console.log("Patched LiquidTabBarPlugin.swift to include UIViewController child hierarchy!");
