#import <Capacitor/Capacitor.h>

CAP_PLUGIN(LiquidTabBarPlugin, "LiquidTabBar",
    CAP_PLUGIN_METHOD(setHidden, CAPPluginReturnPromise);
    CAP_PLUGIN_METHOD(initializeTabBar, CAPPluginReturnPromise);
    CAP_PLUGIN_METHOD(updateTab, CAPPluginReturnPromise);
    CAP_PLUGIN_METHOD(updateNowPlaying, CAPPluginReturnPromise);
    CAP_PLUGIN_METHOD(updateBadge, CAPPluginReturnPromise);
)

