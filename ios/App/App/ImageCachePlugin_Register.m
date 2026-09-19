#import <Capacitor/Capacitor.h>

CAP_PLUGIN(ImageCachePlugin, "ImageCache",
    CAP_PLUGIN_METHOD(getCachedImageUrl, CAPPluginReturnPromise);
    CAP_PLUGIN_METHOD(clearCache, CAPPluginReturnPromise);
    CAP_PLUGIN_METHOD(getCacheSize, CAPPluginReturnPromise);
)
