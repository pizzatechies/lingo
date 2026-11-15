import UIKit
import Capacitor

/// Registers app-local plugins (Capacitor 7 needs local plugins registered on the bridge).
class MainViewController: CAPBridgeViewController {
    override open func capacitorDidLoad() {
        bridge?.registerPluginInstance(WidgetBridgePlugin())
    }
}
