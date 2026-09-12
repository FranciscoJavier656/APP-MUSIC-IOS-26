import UIKit
import Capacitor

class MyBridgeViewController: CAPBridgeViewController {
    override open func capacitorDidLoad() {
        super.capacitorDidLoad()
        
        // Manual registration of the local QobuzAudioPlugin
        if let pluginClass = NSClassFromString("QobuzAudioPlugin") as? NSObject.Type {
            if let pluginInstance = pluginClass.init() as? CAPPlugin {
                self.bridge?.registerPluginInstance(pluginInstance)
                print("⚡️ [Capacitor] Successfully registered QobuzAudioPlugin manually.")
            } else {
                print("⚡️ [Capacitor] Found QobuzAudioPlugin class but couldn't cast to CAPPlugin.")
            }
        } else {
            print("⚡️ [Capacitor] QobuzAudioPlugin class not found via NSClassFromString.")
        }

        // Manual registration of LiquidTabBarPlugin (iOS 26 Liquid Glass tab bar)
        if let pluginClass = NSClassFromString("LiquidTabBarPlugin") as? NSObject.Type {
            if let pluginInstance = pluginClass.init() as? CAPPlugin {
                self.bridge?.registerPluginInstance(pluginInstance)
                print("⚡️ [Capacitor] Successfully registered LiquidTabBarPlugin manually.")
            } else {
                print("⚡️ [Capacitor] Found LiquidTabBarPlugin class but couldn't cast to CAPPlugin.")
            }
        } else {
            print("⚡️ [Capacitor] LiquidTabBarPlugin class not found via NSClassFromString.")
        }
    }
}

class SceneDelegate: UIResponder, UIWindowSceneDelegate {
    var window: UIWindow?

    func scene(_ scene: UIScene, willConnectTo session: UISceneSession, options connectionOptions: UIScene.ConnectionOptions) {
        guard let windowScene = scene as? UIWindowScene else { return }
        window = UIWindow(windowScene: windowScene)
        window?.rootViewController = MyBridgeViewController()
        window?.makeKeyAndVisible()
        SceneDelegateProxy.shared.scene(scene, willConnectTo: session, options: connectionOptions)
    }

    func scene(_ scene: UIScene, openURLContexts URLContexts: Set<UIOpenURLContext>) {
        SceneDelegateProxy.shared.scene(scene, openURLContexts: URLContexts)
    }

    func scene(_ scene: UIScene, continue userActivity: NSUserActivity) {
        SceneDelegateProxy.shared.scene(scene, continue: userActivity)
    }
}
