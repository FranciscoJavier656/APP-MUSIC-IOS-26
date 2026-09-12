import Foundation
import Capacitor
import SwiftUI

@objc(LiquidTabBarPlugin)
public class LiquidTabBarPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "LiquidTabBarPlugin"
    public let jsName     = "LiquidTabBar"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "initializeTabBar", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "updateTab",        returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "setHidden",        returnType: CAPPluginReturnPromise),
    ]

    @objc func initializeTabBar(_ call: CAPPluginCall) {
        // In the True Hybrid Architecture, the TabBar is provided natively by SceneDelegate.swift
        // We just resolve immediately to tell React that we are indeed in native mode.
        call.resolve()
    }
    
    @objc func updateTab(_ call: CAPPluginCall) {
        // Left intact for compatibility, but the web side now listens via CustomEvent('navigate')
        call.resolve()
    }
    
    @objc func setHidden(_ call: CAPPluginCall) {
        // TabBar minimize behavior is handled by SwiftUI automatically using .tabBarMinimizeBehavior(.onScrollDown)
        call.resolve()
    }
}
