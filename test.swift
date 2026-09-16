import SwiftUI

class CAPBridgeViewController: UIViewController {}

struct SharedBridgeViewController: UIViewControllerRepresentable {
    let bridgeVC: CAPBridgeViewController
    
    func makeUIViewController(context: Context) -> UIViewController {
        let vc = UIViewController()
        vc.view.backgroundColor = .clear
        return vc
    }
    
    func updateUIViewController(_ uiViewController: UIViewController, context: Context) {
        if bridgeVC.parent != uiViewController {
            bridgeVC.willMove(toParent: nil)
            bridgeVC.view.removeFromSuperview()
            bridgeVC.removeFromParent()
            
            uiViewController.addChild(bridgeVC)
            bridgeVC.view.frame = uiViewController.view.bounds
            bridgeVC.view.autoresizingMask = [.flexibleWidth, .flexibleHeight]
            uiViewController.view.addSubview(bridgeVC.view)
            bridgeVC.didMove(toParent: uiViewController)
        }
    }
}
