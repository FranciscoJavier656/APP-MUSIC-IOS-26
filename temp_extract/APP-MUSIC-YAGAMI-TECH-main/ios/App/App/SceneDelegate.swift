import UIKit
import Capacitor

class MyBridgeViewController: CAPBridgeViewController {
    override open func capacitorDidLoad() {
        super.capacitorDidLoad()

        // ── QobuzAudioPlugin ──────────────────────────────────────────────
        // NSClassFromString works for QobuzAudioPlugin because it's ObjC-registered.
        if let cls = NSClassFromString("QobuzAudioPlugin") as? NSObject.Type,
           let plugin = cls.init() as? CAPPlugin {
            self.bridge?.registerPluginInstance(plugin)
            print("⚡️ [Capacitor] QobuzAudioPlugin registered.")
        } else {
            print("⚡️ [Capacitor] QobuzAudioPlugin not found.")
        }

        // ── LiquidTabBarPlugin ────────────────────────────────────────────
        // Direct Swift instantiation — avoids NSClassFromString failures
        // with Swift class name mangling (e.g. "App.LiquidTabBarPlugin").
        // The CAPBridgedPlugin protocol provides identifier/jsName/pluginMethods
        // so Capacitor knows how to route JS calls to this plugin instance.
        let liquidTabBarPlugin = LiquidTabBarPlugin()
        self.bridge?.registerPluginInstance(liquidTabBarPlugin)
        print("⚡️ [Capacitor] LiquidTabBarPlugin registered (direct instantiation).")
    }
}

class SceneDelegate: UIResponder, UIWindowSceneDelegate {
    var window: UIWindow?

    func scene(_ scene: UIScene,
               willConnectTo session: UISceneSession,
               options connectionOptions: UIScene.ConnectionOptions) {
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
