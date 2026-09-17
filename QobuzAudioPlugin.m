#import <Foundation/Foundation.h>
#import <Capacitor/Capacitor.h>

// Registramos el plugin para que React pueda verlo
CAP_PLUGIN(QobuzAudioPlugin, "QobuzAudio",
    CAP_PLUGIN_METHOD(play, CAPPluginReturnPromise);
    CAP_PLUGIN_METHOD(pause, CAPPluginReturnPromise);
    CAP_PLUGIN_METHOD(resume, CAPPluginReturnPromise);
    CAP_PLUGIN_METHOD(seek, CAPPluginReturnPromise);
)