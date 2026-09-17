#import <Capacitor/Capacitor.h>

// Define the plugin using the CAP_PLUGIN Macro, and
// each method the plugin supports using the CAP_PLUGIN_METHOD macro.
CAP_PLUGIN(YagamiDownloadManager, "YagamiDownloadManager",
    CAP_PLUGIN_METHOD(downloadTrack, CAPPluginReturnPromise);
    CAP_PLUGIN_METHOD(getVibrantColor, CAPPluginReturnPromise);
)
