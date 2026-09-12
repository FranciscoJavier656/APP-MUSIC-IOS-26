#import <Capacitor/Capacitor.h>

// This file exists purely to trick the Capacitor CLI into registering the plugin in capacitor.config.json.
// We commented out the macro so it doesn't cause duplicate interface errors during compilation.
// CAP_PLUGIN(QobuzAudioPlugin, "QobuzAudio",
//    CAP_PLUGIN_METHOD(play, CAPPluginReturnPromise);
//    CAP_PLUGIN_METHOD(pause, CAPPluginReturnPromise);
//    CAP_PLUGIN_METHOD(resume, CAPPluginReturnPromise);
//    CAP_PLUGIN_METHOD(seek, CAPPluginReturnPromise);
// )
