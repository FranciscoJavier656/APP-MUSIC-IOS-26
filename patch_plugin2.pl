#!/usr/bin/perl
undef $/;
$_ = <>;

$hidden_method = <<'END_METHOD';
    // ── Called from JS when user scrolls ──
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

    // ── Called from JS when user changes tab from web side ──
END_METHOD

s/    \/\/ ── Called from JS when user changes tab from web side ──/$hidden_method/s;
print;
