#import <Capacitor/Capacitor.h>

CAP_PLUGIN(LiquidTabBarPlugin, "LiquidTabBar",
    CAP_PLUGIN_METHOD(setHidden, CAPPluginReturnPromise);
    CAP_PLUGIN_METHOD(hide, CAPPluginReturnPromise);
    CAP_PLUGIN_METHOD(show, CAPPluginReturnPromise);
    CAP_PLUGIN_METHOD(initializeTabBar, CAPPluginReturnPromise);
    CAP_PLUGIN_METHOD(updateTab, CAPPluginReturnPromise);
    CAP_PLUGIN_METHOD(updateNowPlaying, CAPPluginReturnPromise);
    CAP_PLUGIN_METHOD(updateBadge, CAPPluginReturnPromise);
)

#import <Capacitor/Capacitor.h>
CAP_PLUGIN(ImageCachePlugin, "ImageCache",
    CAP_PLUGIN_METHOD(getCachedImageUrl, CAPPluginReturnPromise);
    CAP_PLUGIN_METHOD(clearCache, CAPPluginReturnPromise);
    CAP_PLUGIN_METHOD(getCacheSize, CAPPluginReturnPromise);
)
