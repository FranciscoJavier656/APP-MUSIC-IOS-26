#import <Capacitor/Capacitor.h>

CAP_PLUGIN(LiquidTabBarPlugin, "LiquidTabBar",
    CAP_PLUGIN_METHOD(initializeTabBar, CAPPluginReturnPromise);
    CAP_PLUGIN_METHOD(updateTab, CAPPluginReturnPromise);
)
