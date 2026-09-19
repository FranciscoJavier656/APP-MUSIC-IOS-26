import Foundation

public class YagamiBackgroundSessionManager {
    public static let shared = YagamiBackgroundSessionManager()
    public var completionHandler: (() -> Void)?
    
    private init() {}
}
