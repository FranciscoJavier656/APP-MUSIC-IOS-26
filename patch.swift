import Foundation
import Capacitor
import SwiftUI
import UIKit

// MARK: - Observable State
class LiquidTabBarState: ObservableObject {
    @Published var activeTab: String
    @Published var stretchFactor: CGFloat = 0.0
    init(activeTab: String = "home") {
        self.activeTab = activeTab
    }
}
