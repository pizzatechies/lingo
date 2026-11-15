import Foundation
import Capacitor
import WidgetKit

/// Receives a JSON snapshot of the learner's progress from the web app and shares it with the
/// home-screen / lock-screen widgets through the App Group, then asks WidgetKit to refresh.
@objc(WidgetBridgePlugin)
public class WidgetBridgePlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "WidgetBridgePlugin"
    public let jsName = "WidgetBridge"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "update", returnType: CAPPluginReturnPromise)
    ]

    static let appGroup = "group.ke.lugha.app"

    @objc func update(_ call: CAPPluginCall) {
        guard let json = call.getString("json"), let data = json.data(using: .utf8) else {
            call.reject("Missing json")
            return
        }
        UserDefaults(suiteName: WidgetBridgePlugin.appGroup)?.set(data, forKey: "widgetData")
        WidgetCenter.shared.reloadAllTimelines()
        call.resolve()
    }
}
