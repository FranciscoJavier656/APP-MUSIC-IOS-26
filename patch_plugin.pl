#!/usr/bin/perl
undef $/;
$_ = <>;

$replacement = <<'END_REPLACEMENT';
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "initializeTabBar", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "updateTab",        returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "setHidden",        returnType: CAPPluginReturnPromise),
    ]
END_REPLACEMENT

s/    public let pluginMethods: \[CAPPluginMethod\] = \[\n        CAPPluginMethod\(name: "initializeTabBar", returnType: CAPPluginReturnPromise\),\n        CAPPluginMethod\(name: "updateTab",        returnType: CAPPluginReturnPromise\),\n    \]/$replacement/s;

$hidden_method = <<'END_METHOD';
    @objc func setHidden(_ call: CAPPluginCall) {
        let isHidden = call.getBool("isHidden") ?? false
        DispatchQueue.main.async { [weak self] in
            guard let self = self, let hostView = self.hostVC?.view else {
                call.resolve()
                return
            }
            if self.isTabBarHidden == isHidden {
                call.resolve()
                return
            }
            self.isTabBarHidden = isHidden
            UIView.animate(withDuration: 0.4, delay: 0, usingSpringWithDamping: 0.75, initialSpringVelocity: 0.5, options: .curveEaseInOut, animations: {
                if isHidden {
                    hostView.transform = CGAffineTransform(translationX: 0, y: 150)
                    hostView.alpha = 0.0
                } else {
                    hostView.transform = .identity
                    hostView.alpha = 1.0
                }
            })
            call.resolve()
        }
    }
END_METHOD

s/    @objc func updateTab\(_ call: CAPPluginCall\) \{/$hidden_method\n\n    \@objc func updateTab\(_ call: CAPPluginCall\) \{/s;

print;
