#!/usr/bin/perl
undef $/;
$_ = <>;

$replacement = <<'END_REPLACEMENT';
    private var barState: LiquidTabBarState?
    private var hostVC:   UIViewController?
    private var lastScrollY: CGFloat = 0
    private var isTabBarHidden: Bool = false
    private var scrollObserver: NSKeyValueObservation?
    
    // ── Called from JS: LiquidTabBarNative.initializeTabBar({ activeTab }) ──
    @objc func initializeTabBar(_ call: CAPPluginCall) {
        let initialTab = call.getString("activeTab") ?? "home"
        
        DispatchQueue.main.async { [weak self] in
            guard let self else { call.reject("Plugin deallocated"); return }
            
            // Already installed — just resolve
            if self.hostVC != nil { call.resolve(); return }
            
            guard let parentVC = self.bridge?.viewController else {
                call.reject("No root view controller")
                return
            }
            
            let state = LiquidTabBarState(activeTab: initialTab)
            state.activeTab = initialTab
            self.barState = state
            
            let contentView = LiquidTabBarView(state: state) { [weak self] tabId in
                self?.notifyListeners("onTabSelected", data: ["tabId": tabId])
            }
            
            let host = UIHostingController(rootView: contentView)
            host.view.backgroundColor = .clear
            host.view.isOpaque        = false
            host.view.translatesAutoresizingMaskIntoConstraints = false
            
            parentVC.addChild(host)
            parentVC.view.addSubview(host.view)
            host.didMove(toParent: parentVC)
            
            NSLayoutConstraint.activate([
                host.view.leadingAnchor.constraint(equalTo: parentVC.view.leadingAnchor),
                host.view.trailingAnchor.constraint(equalTo: parentVC.view.trailingAnchor),
                host.view.bottomAnchor.constraint(equalTo: parentVC.view.bottomAnchor),
                host.view.heightAnchor.constraint(equalToConstant: 140),
            ])
            
            self.hostVC = host
            
            // WWDC 26: iOS 18 minimize tab bar on scroll (Bridge integration)
            if let webView = self.bridge?.webView {
                self.scrollObserver = webView.scrollView.observe(\.contentOffset, options: [.new]) { [weak self] scrollView, change in
                    guard let self = self, let hostView = self.hostVC?.view else { return }
                    
                    let currentY = scrollView.contentOffset.y
                    let deltaY = currentY - self.lastScrollY
                    self.lastScrollY = currentY
                    
                    // Don't hide if bouncing at top or bottom
                    if currentY < 0 || currentY > (scrollView.contentSize.height - scrollView.bounds.height) {
                        return
                    }
                    
                    if deltaY > 5 && !self.isTabBarHidden {
                        // Scrolling down -> hide Tab Bar
                        self.isTabBarHidden = true
                        UIView.animate(withDuration: 0.4, delay: 0, usingSpringWithDamping: 0.75, initialSpringVelocity: 0.5, options: .curveEaseInOut, animations: {
                            hostView.transform = CGAffineTransform(translationX: 0, y: 150)
                            hostView.alpha = 0.3
                        })
                    } else if deltaY < -5 && self.isTabBarHidden {
                        // Scrolling up -> show Tab Bar
                        self.isTabBarHidden = false
                        UIView.animate(withDuration: 0.4, delay: 0, usingSpringWithDamping: 0.75, initialSpringVelocity: 0.5, options: .curveEaseInOut, animations: {
                            hostView.transform = .identity
                            hostView.alpha = 1.0
                        })
                    }
                }
            }
            
            print("⚡️ [LiquidTabBar] Native tab bar installed.")
            call.resolve()
        }
    }
END_REPLACEMENT

s/    private var barState: LiquidTabBarState\?\n    private var hostVC:   UIViewController\?\n\n    \/\/ ── Called from JS: LiquidTabBarNative\.initializeTabBar\(\{ activeTab \}\) ──\n    \@objc func initializeTabBar\(_ call: CAPPluginCall\) \{.*?            call\.resolve\(\)\n        \}\n    \}/$replacement/s;
print;
