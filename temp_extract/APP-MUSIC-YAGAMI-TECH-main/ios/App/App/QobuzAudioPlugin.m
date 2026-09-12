#import <CoreMedia/CoreMedia.h>
#import <Foundation/Foundation.h>
#import <UIKit/UIKit.h>
#import <Capacitor/Capacitor.h>
#import <Capacitor/CAPBridgedJSTypes.h>
#import <Capacitor/Capacitor-Swift.h>
#import <AVFoundation/AVFoundation.h>
#import <MediaPlayer/MediaPlayer.h>
#import <MediaToolbox/MediaToolbox.h>
#import <Accelerate/Accelerate.h>
#include <sys/xattr.h>

#define FFT_SIZE 1024
#define NUM_BINS 64

@interface QobuzAudioPlugin : CAPPlugin
@property (nonatomic, strong) AVPlayer *player;
@property (nonatomic, assign) BOOL isPlaying;
@property (nonatomic, assign) NSTimeInterval lastFftUpdate;
@property (nonatomic, strong) id errorLogObservation;
@property (nonatomic, strong) id timeObserver;
@property (nonatomic, strong) id endObservation;
@end

@interface QobuzAudioPlugin (CAPPluginCategory) <CAPBridgedPlugin>
@end

@implementation QobuzAudioPlugin (CAPPluginCategory)
- (NSString *)identifier { return @"QobuzAudioPlugin"; }
- (NSString *)jsName { return @"QobuzAudio"; }
- (NSArray *)pluginMethods {
    NSMutableArray *methods = [NSMutableArray new];
    [methods addObject:[[CAPPluginMethod alloc] initWithName:@"play" returnType:CAPPluginReturnPromise]];
    [methods addObject:[[CAPPluginMethod alloc] initWithName:@"pause" returnType:CAPPluginReturnPromise]];
    [methods addObject:[[CAPPluginMethod alloc] initWithName:@"resume" returnType:CAPPluginReturnPromise]];
    [methods addObject:[[CAPPluginMethod alloc] initWithName:@"seek" returnType:CAPPluginReturnPromise]];
    [methods addObject:[[CAPPluginMethod alloc] initWithName:@"updateMetadata" returnType:CAPPluginReturnPromise]];
    [methods addObject:[[CAPPluginMethod alloc] initWithName:@"setupRemoteControls" returnType:CAPPluginReturnPromise]];
    [methods addObject:[[CAPPluginMethod alloc] initWithName:@"embedLyrics" returnType:CAPPluginReturnPromise]];
    return methods;
}
@end

// Context for the audio tap
typedef struct {
    void *plugin;
    FFTSetup fftSetup;
    int fftSize;
    int log2n;
    float *window;
    float *realBuffer;
    float *imagBuffer;
    float *magnitudes;
    DSPSplitComplex splitComplex;
    int binIndices[NUM_BINS + 1];
} TapContext;

// MTAudioProcessingTap callbacks
static void tapInit(MTAudioProcessingTapRef tap, void *clientInfo, void **tapStorageOut) {
    TapContext *context = (TapContext *)malloc(sizeof(TapContext));
    context->plugin = clientInfo;
    context->fftSize = FFT_SIZE;
    context->log2n = 10; // log2(1024)
    context->fftSetup = vDSP_create_fftsetup((vDSP_Length)context->log2n, kFFTRadix2);
    
    int halfSize = context->fftSize / 2;
    context->window = (float *)malloc(sizeof(float) * context->fftSize);
    context->realBuffer = (float *)malloc(sizeof(float) * halfSize);
    context->imagBuffer = (float *)malloc(sizeof(float) * halfSize);
    context->magnitudes = (float *)malloc(sizeof(float) * halfSize);
    context->splitComplex.realp = context->realBuffer;
    context->splitComplex.imagp = context->imagBuffer;
    
    vDSP_hann_window(context->window, (vDSP_Length)context->fftSize, vDSP_HANN_NORM);
    
    // Pre-calculate Mel/Logarithmic Bin Indices
    // Sample rate approx 44100, Nyquist = 22050
    // Bin resolution = 22050 / 2048 = 10.76 Hz per bin
    float minFreq = 40.0;
    float maxFreq = 16000.0;
    float minMel = 2595.0 * log10f(1.0 + minFreq / 700.0);
    float maxMel = 2595.0 * log10f(1.0 + maxFreq / 700.0);
    
    for (int i = 0; i <= NUM_BINS; i++) {
        float mel = minMel + ((float)i / (float)NUM_BINS) * (maxMel - minMel);
        float freq = 700.0 * (powf(10.0, mel / 2595.0) - 1.0);
        int binIndex = (int)(freq / 43.066);
        if (binIndex < 1) binIndex = 1; // skip DC
        if (binIndex > halfSize - 1) binIndex = halfSize - 1;
        context->binIndices[i] = binIndex;
    }
    
    // Ensure minimum 1 bin width
    for (int i = 0; i < NUM_BINS; i++) {
        if (context->binIndices[i+1] <= context->binIndices[i]) {
            context->binIndices[i+1] = context->binIndices[i] + 1;
            if (context->binIndices[i+1] > halfSize - 1) {
                context->binIndices[i+1] = halfSize - 1;
            }
        }
    }
    
    *tapStorageOut = context;
}

static void tapFinalize(MTAudioProcessingTapRef tap) {
    TapContext *context = (TapContext *)MTAudioProcessingTapGetStorage(tap);
    if (context) {
        vDSP_destroy_fftsetup(context->fftSetup);
        free(context->window);
        free(context->realBuffer);
        free(context->imagBuffer);
        free(context->magnitudes);
        free(context);
    }
}

static void tapPrepare(MTAudioProcessingTapRef tap, CMItemCount maxFrames, const AudioStreamBasicDescription *processingFormat) {}
static void tapUnprepare(MTAudioProcessingTapRef tap) {}

static void tapProcess(MTAudioProcessingTapRef tap, CMItemCount numberFrames, MTAudioProcessingTapFlags flags, AudioBufferList *bufferListInOut, CMItemCount *numberFramesOut, MTAudioProcessingTapFlags *flagsOut) {
    
    OSStatus status = MTAudioProcessingTapGetSourceAudio(tap, numberFrames, bufferListInOut, flagsOut, NULL, numberFramesOut);
    if (status != noErr) return;
    
    TapContext *context = (TapContext *)MTAudioProcessingTapGetStorage(tap);
    if (!context || numberFrames < context->fftSize) return;
    
    QobuzAudioPlugin *plugin = (__bridge QobuzAudioPlugin *)context->plugin;
    if (!plugin.isPlaying) return;
    
    NSTimeInterval now = [[NSDate date] timeIntervalSince1970];
    if (now - plugin.lastFftUpdate < 0.033) return; // approx 30fps
    
    float *samples = (float *)bufferListInOut->mBuffers[0].mData;
    if (!samples) return;
    
    int halfSize = context->fftSize / 2;
    float windowedBuffer[FFT_SIZE];
    
    vDSP_vmul(samples, 1, context->window, 1, windowedBuffer, 1, (vDSP_Length)context->fftSize);
    vDSP_ctoz((DSPComplex *)windowedBuffer, 2, &context->splitComplex, 1, (vDSP_Length)halfSize);
    vDSP_fft_zrip(context->fftSetup, &context->splitComplex, 1, (vDSP_Length)context->log2n, FFT_FORWARD);
    vDSP_zvabs(&context->splitComplex, 1, context->magnitudes, 1, (vDSP_Length)halfSize);
    
    float scale = 2.0 / (float)context->fftSize;
    vDSP_vsmul(context->magnitudes, 1, &scale, context->magnitudes, 1, (vDSP_Length)halfSize);
    
    NSMutableArray *result = [NSMutableArray arrayWithCapacity:NUM_BINS];
    
    for (int i = 0; i < NUM_BINS; i++) {
        int startBin = context->binIndices[i];
        int endBin = context->binIndices[i+1];
        
        float maxVal = 0;
        for (int j = startBin; j < endBin; j++) {
            if (context->magnitudes[j] > maxVal) {
                maxVal = context->magnitudes[j];
            }
        }
        
        // Adjust gain based on frequency (higher frequencies need more boost)
        float freqBoost = 1.0 + ((float)i / (float)NUM_BINS) * 4.0;
        float val = maxVal * 25.0 * freqBoost; // tuned multiplier
        
        int scaled = MIN(MAX((int)(val * 255.0), 0), 255);
        [result addObject:@(scaled)];
    }
    
    plugin.lastFftUpdate = now;
    
    dispatch_async(dispatch_get_main_queue(), ^{
        [plugin notifyListeners:@"onFftData" data:@{@"data": result}];
    });
}

@implementation QobuzAudioPlugin

- (void)setupRemoteControls:(CAPPluginCall *)call {
    dispatch_async(dispatch_get_main_queue(), ^{
        MPRemoteCommandCenter *commandCenter = [MPRemoteCommandCenter sharedCommandCenter];
        
        [commandCenter.playCommand removeTarget:nil];
        [commandCenter.pauseCommand removeTarget:nil];
        [commandCenter.nextTrackCommand removeTarget:nil];
        [commandCenter.previousTrackCommand removeTarget:nil];
        [commandCenter.changePlaybackPositionCommand removeTarget:nil];
        
        [commandCenter.playCommand addTargetWithHandler:^MPRemoteCommandHandlerStatus(MPRemoteCommandEvent * _Nonnull event) {
            __block UIBackgroundTaskIdentifier bgTask = [[UIApplication sharedApplication] beginBackgroundTaskWithExpirationHandler:^{
                [[UIApplication sharedApplication] endBackgroundTask:bgTask];
                bgTask = UIBackgroundTaskInvalid;
            }];
            [self notifyListeners:@"onRemotePlay" data:@{}];
            dispatch_after(dispatch_time(DISPATCH_TIME_NOW, (int64_t)(5.0 * NSEC_PER_SEC)), dispatch_get_main_queue(), ^{
                if (bgTask != UIBackgroundTaskInvalid) {
                    [[UIApplication sharedApplication] endBackgroundTask:bgTask];
                }
            });
            return MPRemoteCommandHandlerStatusSuccess;
        }];
        
        [commandCenter.pauseCommand addTargetWithHandler:^MPRemoteCommandHandlerStatus(MPRemoteCommandEvent * _Nonnull event) {
            __block UIBackgroundTaskIdentifier bgTask = [[UIApplication sharedApplication] beginBackgroundTaskWithExpirationHandler:^{
                [[UIApplication sharedApplication] endBackgroundTask:bgTask];
                bgTask = UIBackgroundTaskInvalid;
            }];
            [self notifyListeners:@"onRemotePause" data:@{}];
            dispatch_after(dispatch_time(DISPATCH_TIME_NOW, (int64_t)(5.0 * NSEC_PER_SEC)), dispatch_get_main_queue(), ^{
                if (bgTask != UIBackgroundTaskInvalid) {
                    [[UIApplication sharedApplication] endBackgroundTask:bgTask];
                }
            });
            return MPRemoteCommandHandlerStatusSuccess;
        }];
        
        [commandCenter.nextTrackCommand addTargetWithHandler:^MPRemoteCommandHandlerStatus(MPRemoteCommandEvent * _Nonnull event) {
            __block UIBackgroundTaskIdentifier bgTask = [[UIApplication sharedApplication] beginBackgroundTaskWithExpirationHandler:^{
                [[UIApplication sharedApplication] endBackgroundTask:bgTask];
                bgTask = UIBackgroundTaskInvalid;
            }];
            [self notifyListeners:@"onRemoteNext" data:@{}];
            dispatch_after(dispatch_time(DISPATCH_TIME_NOW, (int64_t)(5.0 * NSEC_PER_SEC)), dispatch_get_main_queue(), ^{
                if (bgTask != UIBackgroundTaskInvalid) {
                    [[UIApplication sharedApplication] endBackgroundTask:bgTask];
                }
            });
            return MPRemoteCommandHandlerStatusSuccess;
        }];
        
        [commandCenter.previousTrackCommand addTargetWithHandler:^MPRemoteCommandHandlerStatus(MPRemoteCommandEvent * _Nonnull event) {
            __block UIBackgroundTaskIdentifier bgTask = [[UIApplication sharedApplication] beginBackgroundTaskWithExpirationHandler:^{
                [[UIApplication sharedApplication] endBackgroundTask:bgTask];
                bgTask = UIBackgroundTaskInvalid;
            }];
            [self notifyListeners:@"onRemotePrev" data:@{}];
            dispatch_after(dispatch_time(DISPATCH_TIME_NOW, (int64_t)(5.0 * NSEC_PER_SEC)), dispatch_get_main_queue(), ^{
                if (bgTask != UIBackgroundTaskInvalid) {
                    [[UIApplication sharedApplication] endBackgroundTask:bgTask];
                }
            });
            return MPRemoteCommandHandlerStatusSuccess;
        }];
        
        [commandCenter.changePlaybackPositionCommand addTargetWithHandler:^MPRemoteCommandHandlerStatus(MPRemoteCommandEvent * _Nonnull event) {
            MPChangePlaybackPositionCommandEvent *positionEvent = (MPChangePlaybackPositionCommandEvent *)event;
            [self notifyListeners:@"onRemoteSeek" data:@{@"time": @(positionEvent.positionTime)}];
            return MPRemoteCommandHandlerStatusSuccess;
        }];
        
        [call resolve];
    });
}

- (void)updateNowPlayingState {
    NSMutableDictionary *info = [[MPNowPlayingInfoCenter defaultCenter].nowPlayingInfo mutableCopy];
    if (!info) info = [NSMutableDictionary dictionary];
    
    if (self.player) {
        info[MPNowPlayingInfoPropertyElapsedPlaybackTime] = @(CMTimeGetSeconds(self.player.currentTime));
        info[MPNowPlayingInfoPropertyPlaybackRate] = @(self.isPlaying ? 1.0 : 0.0);
    }
    
    [MPNowPlayingInfoCenter defaultCenter].nowPlayingInfo = info;
}

- (void)updateMetadata:(CAPPluginCall *)call {
    NSString *title = call.options[@"title"];
    NSString *artist = call.options[@"artist"];
    NSString *album = call.options[@"album"];
    NSString *coverUrl = call.options[@"coverUrl"];
    NSNumber *durationNum = call.options[@"duration"];
    
    dispatch_async(dispatch_get_main_queue(), ^{
        NSMutableDictionary *nowPlayingInfo = [[MPNowPlayingInfoCenter defaultCenter].nowPlayingInfo mutableCopy];
        if (!nowPlayingInfo) nowPlayingInfo = [NSMutableDictionary dictionary];
        
        if (title) nowPlayingInfo[MPMediaItemPropertyTitle] = title;
        if (artist) nowPlayingInfo[MPMediaItemPropertyArtist] = artist;
        if (album) nowPlayingInfo[MPMediaItemPropertyAlbumTitle] = album;
        
        if (durationNum) {
            nowPlayingInfo[MPMediaItemPropertyPlaybackDuration] = durationNum;
        }
        
        if (self.player) {
            nowPlayingInfo[MPNowPlayingInfoPropertyElapsedPlaybackTime] = @(CMTimeGetSeconds(self.player.currentTime));
            nowPlayingInfo[MPNowPlayingInfoPropertyPlaybackRate] = @(self.isPlaying ? 1.0 : 0.0);
        }
        
        [MPNowPlayingInfoCenter defaultCenter].nowPlayingInfo = nowPlayingInfo;
        
        // Asynchronous image loading for cover
        if (coverUrl && [coverUrl isKindOfClass:[NSString class]] && coverUrl.length > 0) {
            dispatch_async(dispatch_get_global_queue(DISPATCH_QUEUE_PRIORITY_DEFAULT, 0), ^{
                NSURL *url = [NSURL URLWithString:coverUrl];
                if (url) {
                    NSData *data = [NSData dataWithContentsOfURL:url];
                    if (data) {
                        UIImage *image = [UIImage imageWithData:data];
                        if (image) {
                            MPMediaItemArtwork *artwork = [[MPMediaItemArtwork alloc] initWithBoundsSize:image.size requestHandler:^UIImage * _Nonnull(CGSize size) {
                                return image;
                            }];
                            dispatch_async(dispatch_get_main_queue(), ^{
                                NSMutableDictionary *info = [[MPNowPlayingInfoCenter defaultCenter].nowPlayingInfo mutableCopy];
                                if (!info) info = [NSMutableDictionary dictionary];
                                info[MPMediaItemPropertyArtwork] = artwork;
                                [MPNowPlayingInfoCenter defaultCenter].nowPlayingInfo = info;
                            });
                        }
                    }
                }
            });
        }
        
        [call resolve];
    });
}


- (void)logMessage:(NSString *)msg {
    NSLog(@"[QOBUZ NATIVE] %@", msg);
    dispatch_async(dispatch_get_main_queue(), ^{
        [self notifyListeners:@"onDebugLog" data:@{@"message": msg}];
    });
}

- (void)play:(CAPPluginCall *)call {
    NSString *urlString = call.options[@"url"];
    if (!urlString || ![urlString isKindOfClass:[NSString class]]) {
        [self logMessage:@"❌ Error: URL inválida"];
        [call resolve];
        return;
    }
    
    NSURL *url;
    if ([urlString hasPrefix:@"file://"]) {
        url = [NSURL fileURLWithPath:[urlString substringFromIndex:7]];
    } else if ([urlString hasPrefix:@"/"]) {
        url = [NSURL fileURLWithPath:urlString];
    } else {
        url = [NSURL URLWithString:urlString];
    }
    if (!url) {
        [self logMessage:@"❌ Error: URL mal formada"];
        [call resolve];
        return;
    }
    
    [self logMessage:@"-------------"];
    [self logMessage:[NSString stringWithFormat:@"▶️ Iniciando URL: %@", urlString]];
    
    NSError *error = nil;
    [[AVAudioSession sharedInstance] setCategory:AVAudioSessionCategoryPlayback mode:AVAudioSessionModeDefault options:0 error:&error];
    [[AVAudioSession sharedInstance] setPreferredSampleRate:192000.0 error:&error]; // 192kHz Hi-Res FLAC Support
    [[AVAudioSession sharedInstance] setActive:YES error:&error];
    [[UIApplication sharedApplication] beginReceivingRemoteControlEvents];
    
    AVURLAsset *asset = [AVURLAsset URLAssetWithURL:url options:nil];
    AVPlayerItem *playerItem = [AVPlayerItem playerItemWithAsset:asset];
    
    __weak typeof(self) weakSelf = self;
    
    dispatch_async(dispatch_get_main_queue(), ^{
        // REMOVE OLD OBSERVERS BEFORE OVERWRITING THE PLAYER
        if (weakSelf.timeObserver && weakSelf.player) {
            [weakSelf.player removeTimeObserver:weakSelf.timeObserver];
            weakSelf.timeObserver = nil;
        }
        
        weakSelf.player = [AVPlayer playerWithPlayerItem:playerItem];
        
        if (weakSelf.errorLogObservation) {
            [[NSNotificationCenter defaultCenter] removeObserver:weakSelf.errorLogObservation];
        }
        if (weakSelf.endObservation) {
            [[NSNotificationCenter defaultCenter] removeObserver:weakSelf.endObservation];
        }
        
        weakSelf.errorLogObservation = [[NSNotificationCenter defaultCenter] addObserverForName:AVPlayerItemFailedToPlayToEndTimeNotification object:playerItem queue:[NSOperationQueue mainQueue] usingBlock:^(NSNotification * _Nonnull note) {
            NSError *err = note.userInfo[AVPlayerItemFailedToPlayToEndTimeErrorKey];
            [weakSelf logMessage:[NSString stringWithFormat:@"⚠️ Error interno AVPlayer: %@", err.localizedDescription]];
        }];
        
        weakSelf.endObservation = [[NSNotificationCenter defaultCenter] addObserverForName:AVPlayerItemDidPlayToEndTimeNotification object:playerItem queue:[NSOperationQueue mainQueue] usingBlock:^(NSNotification * _Nonnull note) {
            __block UIBackgroundTaskIdentifier bgTask = [[UIApplication sharedApplication] beginBackgroundTaskWithExpirationHandler:^{
                [[UIApplication sharedApplication] endBackgroundTask:bgTask];
                bgTask = UIBackgroundTaskInvalid;
            }];
            [weakSelf notifyListeners:@"onEnded" data:@{}];
            [weakSelf logMessage:@"🏁 Pista terminada nativamente. Emitiendo onEnded a JS con Background Task."];
            dispatch_after(dispatch_time(DISPATCH_TIME_NOW, (int64_t)(5.0 * NSEC_PER_SEC)), dispatch_get_main_queue(), ^{
                if (bgTask != UIBackgroundTaskInvalid) {
                    [[UIApplication sharedApplication] endBackgroundTask:bgTask];
                }
            });
        }];
        
        weakSelf.timeObserver = [weakSelf.player addPeriodicTimeObserverForInterval:CMTimeMake(1, 10) queue:dispatch_get_main_queue() usingBlock:^(CMTime time) {
            float currentTime = CMTimeGetSeconds(time);
            float duration = CMTimeGetSeconds(weakSelf.player.currentItem.duration);
            if (isnan(duration)) duration = 0;
            [weakSelf notifyListeners:@"onTimeUpdate" data:@{@"currentTime": @(currentTime), @"duration": @(duration)}];
        }];
        
        [weakSelf.player play];
        weakSelf.isPlaying = YES;
        [weakSelf updateNowPlayingState];
        [weakSelf logMessage:@"🚀 Play() ejecutado. Obj-C manejando todo."];
        [call resolve];
    });
    
    [asset loadTracksWithMediaType:AVMediaTypeAudio completionHandler:^(NSArray<AVAssetTrack *> * _Nullable tracks, NSError * _Nullable loadError) {
        if (!tracks || tracks.count == 0) {
            [weakSelf logMessage:@"❌ No se encontró pista de audio en ObjC"];
            return;
        }
        
        AVAssetTrack *audioTrack = tracks.firstObject;
        
        MTAudioProcessingTapCallbacks callbacks;
        callbacks.version = kMTAudioProcessingTapCallbacksVersion_0;
        callbacks.clientInfo = (__bridge void *)self; 
        callbacks.init = tapInit;
        callbacks.finalize = tapFinalize;
        callbacks.prepare = tapPrepare;
        callbacks.unprepare = tapUnprepare;
        callbacks.process = tapProcess;
        
        MTAudioProcessingTapRef tap;
        OSStatus status = MTAudioProcessingTapCreate(kCFAllocatorDefault, &callbacks, kMTAudioProcessingTapCreationFlag_PostEffects, &tap);
        
        if (status == noErr && tap) {
            AVMutableAudioMixInputParameters *inputParams = [AVMutableAudioMixInputParameters audioMixInputParametersWithTrack:audioTrack];
            inputParams.audioTapProcessor = tap;
            
            AVMutableAudioMix *audioMix = [AVMutableAudioMix audioMix];
            audioMix.inputParameters = @[inputParams];
            
            dispatch_async(dispatch_get_main_queue(), ^{
                playerItem.audioMix = audioMix;
                [weakSelf logMessage:@"✅ Tap inyectado exitosamente al stream activo (Objective-C)"];
                CFRelease(tap); // Release after assigning to prevent early deallocation
            });
        } else {
            [weakSelf logMessage:[NSString stringWithFormat:@"❌ Error creando Tap en ObjC (Status: %d)", (int)status]];
        }
    }];
}

- (void)pause:(CAPPluginCall *)call {
    dispatch_async(dispatch_get_main_queue(), ^{
        [self.player pause];
        self.isPlaying = NO;
        [self updateNowPlayingState];
        [call resolve];
    });
}

- (void)resume:(CAPPluginCall *)call {
    dispatch_async(dispatch_get_main_queue(), ^{
        [self.player play];
        self.isPlaying = YES;
        [self updateNowPlayingState];
        [call resolve];
    });
}

- (void)seek:(CAPPluginCall *)call {
    NSNumber *timeNum = call.options[@"time"];
    if (!timeNum || ![timeNum isKindOfClass:[NSNumber class]]) {
        [call resolve];
        return;
    }
    
    CMTime targetTime = CMTimeMakeWithSeconds([timeNum doubleValue], 600);
    dispatch_async(dispatch_get_main_queue(), ^{
        [self.player seekToTime:targetTime];
        [self updateNowPlayingState];
        [call resolve];
    });
}


- (void)embedLyrics:(CAPPluginCall *)call {
    NSString *path = call.options[@"path"];
    NSString *lyrics = call.options[@"lyrics"];
    
    if (!path || !lyrics) {
        [self logMessage:@"❌ Error: Missing path or lyrics"];
        [call resolve];
        return;
    }
    
    NSURL *url;
    if ([path hasPrefix:@"file://"]) {
        url = [NSURL fileURLWithPath:[path substringFromIndex:7]];
    } else {
        url = [NSURL fileURLWithPath:path];
    }
    
    // 1. Escribir como archivo .lrc sidecar para compatibilidad
    NSString *lrcPath = [[url.path stringByDeletingPathExtension] stringByAppendingPathExtension:@"lrc"];
    NSError *error = nil;
    [lyrics writeToFile:lrcPath atomically:YES encoding:NSUTF8StringEncoding error:&error];
    
    // 2. Intentar escribir como xattr (Metadata extendida de APFS nativa)
    const char *filePath = [url.path UTF8String];
    const char *attrName = "com.apple.metadata:kMDItemLyricist";
    NSData *data = [lyrics dataUsingEncoding:NSUTF8StringEncoding];
    
    setxattr(filePath, attrName, data.bytes, data.length, 0, 0);
    
    [self logMessage:[NSString stringWithFormat:@"✅ Letras incrustadas exitosamente en ObjC para: %@", url.lastPathComponent]];
    
    [call resolve];
}

@end

// --- LIQUID TAB BAR PLUGIN REGISTRATION ---
// Appended to this compiled .m file to ensure registration occurs

CAP_PLUGIN(LiquidTabBarPlugin, "LiquidTabBar",
    CAP_PLUGIN_METHOD(initializeTabBar, CAPPluginReturnPromise);
    CAP_PLUGIN_METHOD(updateTab, CAPPluginReturnPromise);
)
