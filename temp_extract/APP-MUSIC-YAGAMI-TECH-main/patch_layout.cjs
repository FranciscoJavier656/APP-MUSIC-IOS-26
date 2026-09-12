const fs = require('fs');
let code = fs.readFileSync('ios/App/App/LiquidTabBarPlugin.swift', 'utf8');

const target = `                if let webView = self.bridge?.webView, let parent = webView.superview {
                    let bottomHeight: CGFloat = 160
                    host.view.frame = CGRect(x: 0, y: parent.bounds.height - bottomHeight, width: parent.bounds.width, height: bottomHeight)
                    host.view.autoresizingMask = [.flexibleWidth, .flexibleTopMargin]
                    parent.addSubview(host.view)
                    self.hostingController = host
                }`;

const replacement = `                if let webView = self.bridge?.webView, let parent = webView.superview {
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

code = code.replace(target, replacement);

const spacerTarget = `    var body: some View {
        VStack {
            
            // Using iOS 26 GlassEffectContainer`;

const spacerReplacement = `    var body: some View {
        VStack {
            Spacer()
            // Using iOS 26 GlassEffectContainer`;

code = code.replace(spacerTarget, spacerReplacement);

fs.writeFileSync('ios/App/App/LiquidTabBarPlugin.swift', code);
console.log("Patched LiquidTabBarPlugin.swift layout!");
