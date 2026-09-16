import SwiftUI

struct TabViewBackgroundClearer: UIViewControllerRepresentable {
    func makeUIViewController(context: Context) -> UIViewController {
        let vc = UIViewController()
        vc.view.backgroundColor = .clear
        DispatchQueue.main.async {
            var parent = vc.parent
            while let currentParent = parent {
                if let tabBarController = currentParent as? UITabBarController {
                    tabBarController.view.backgroundColor = .clear
                    break
                }
                parent = currentParent.parent
            }
        }
        return vc
    }
    
    func updateUIViewController(_ uiViewController: UIViewController, context: Context) {}
}
