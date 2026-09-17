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
#include <math.h>
#include <string.h>

#define FFT_SIZE 1024
#define NUM_BINS 64
#define EQ_NUM_BANDS 10
#define EQ_MAX_CHANNELS 2

// Center frequencies for 10-band parametric EQ
static const float EQ_FREQ_TABLE[EQ_NUM_BANDS] = {
    32.0f, 64.0f, 125.0f, 250.0f, 500.0f,
    1000.0f, 2000.0f, 4000.0f, 8000.0f, 16000.0f
};

// Default Q factors: wider for shelves, narrower for peaking
static const float EQ_Q_TABLE[EQ_NUM_BANDS] = {
    0.707f, 1.0f, 1.0f, 1.0f, 1.0f,
    1.0f, 1.0f, 1.0f, 1.0f, 0.707f
};

@interface QobuzAudioPlugin : CAPPlugin
@property (nonatomic, strong) AVPlayer *player;
@property (nonatomic, assign) BOOL isPlaying;
@property (nonatomic, assign) NSTimeInterval lastFftUpdate;
@property (nonatomic, strong) id errorLogObservation;
@property (nonatomic, strong) id timeObserver;
@property (nonatomic, strong) id endObservation;
@property (nonatomic, copy) NSString *eqPresetName;
@end

// Static reference to TapContext for EQ control from main thread
static TapContext *g_tapContext = NULL;

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
    // EQ Methods
    [methods addObject:[[CAPPluginMethod alloc] initWithName:@"setEQEnabled" returnType:CAPPluginReturnPromise]];
    [methods addObject:[[CAPPluginMethod alloc] initWithName:@"setEQBand" returnType:CAPPluginReturnPromise]];
    [methods addObject:[[CAPPluginMethod alloc] initWithName:@"setEQPreset" returnType:CAPPluginReturnPromise]];
    [methods addObject:[[CAPPluginMethod alloc] initWithName:@"getEQState" returnType:CAPPluginReturnPromise]];
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
    
    // ── EQ Biquad State ──
    // vDSP_deq22 coefficients: [b0, b1, b2, a1, a2] per band
    // Double-buffered for lock-free coefficient updates from main thread
    float eqCoeffs[2][EQ_NUM_BANDS][5];
    volatile int activeCoeffBuffer;         // 0 or 1, read by audio thread
    
    // Per-channel delay line state for each biquad band: [z-1, z-2]
    // Using Direct Form II Transposed for numerical stability
    float eqDelayState[EQ_MAX_CHANNELS][EQ_NUM_BANDS][2];
    
    float eqGains[EQ_NUM_BANDS];            // Gain in dB per band (-12 to +12)
    volatile BOOL eqEnabled;                // Atomic read from audio thread
    float sampleRate;                       // Captured in tapPrepare
    int numChannels;                        // Captured in tapPrepare
    BOOL isNonInterleaved;                  // Captured in tapPrepare
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
    
    @synchronized ([QobuzAudioPlugin class]) {
        g_tapContext = context; // Store safely for EQ control from UI
    }
    
    // ── Initialize EQ state ──
    context->eqEnabled = NO;
    context->activeCoeffBuffer = 0;
    context->sampleRate = 44100.0f; // Default, overridden in tapPrepare
    context->numChannels = 2;
    memset(context->eqGains, 0, sizeof(context->eqGains));
    memset(context->eqCoeffs, 0, sizeof(context->eqCoeffs));
    memset(context->eqDelayState, 0, sizeof(context->eqDelayState));
    
    // Load persisted EQ state from NSUserDefaults
    NSUserDefaults *defaults = [NSUserDefaults standardUserDefaults];
    NSArray *savedGains = [defaults arrayForKey:@"eq_gains"];
    BOOL savedEnabled = [defaults boolForKey:@"eq_enabled"];
    
    if (savedGains && savedGains.count == EQ_NUM_BANDS) {
        context->eqEnabled = savedEnabled;
        for (int i = 0; i < EQ_NUM_BANDS; i++) {
            context->eqGains[i] = [savedGains[i] floatValue];
        }
    }
}

// ── Biquad Coefficient Calculation (Robert Bristow-Johnson Audio EQ Cookbook) ──
// Computes normalized coefficients for vDSP_deq22 format: [b0/a0, b1/a0, b2/a0, a1/a0, a2/a0]

static void calcPeakingEQ(float *coeffs, float freq, float gainDB, float Q, float sampleRate) {
    float A  = powf(10.0f, gainDB / 40.0f);
    float w0 = 2.0f * M_PI * freq / sampleRate;
    float sinW0 = sinf(w0);
    float cosW0 = cosf(w0);
    float alpha = sinW0 / (2.0f * Q);
    
    float b0 = 1.0f + alpha * A;
    float b1 = -2.0f * cosW0;
    float b2 = 1.0f - alpha * A;
    float a0 = 1.0f + alpha / A;
    float a1 = -2.0f * cosW0;
    float a2 = 1.0f - alpha / A;
    
    coeffs[0] = b0 / a0;
    coeffs[1] = b1 / a0;
    coeffs[2] = b2 / a0;
    coeffs[3] = a1 / a0;
    coeffs[4] = a2 / a0;
}

static void calcLowShelf(float *coeffs, float freq, float gainDB, float Q, float sampleRate) {
    float A  = powf(10.0f, gainDB / 40.0f);
    float w0 = 2.0f * M_PI * freq / sampleRate;
    float sinW0 = sinf(w0);
    float cosW0 = cosf(w0);
    float alpha = sinW0 / (2.0f * Q);
    float sqrtA2alpha = 2.0f * sqrtf(A) * alpha;
    
    float b0 = A * ((A + 1.0f) - (A - 1.0f) * cosW0 + sqrtA2alpha);
    float b1 = 2.0f * A * ((A - 1.0f) - (A + 1.0f) * cosW0);
    float b2 = A * ((A + 1.0f) - (A - 1.0f) * cosW0 - sqrtA2alpha);
    float a0 = (A + 1.0f) + (A - 1.0f) * cosW0 + sqrtA2alpha;
    float a1 = -2.0f * ((A - 1.0f) + (A + 1.0f) * cosW0);
    float a2 = (A + 1.0f) + (A - 1.0f) * cosW0 - sqrtA2alpha;
    
    coeffs[0] = b0 / a0;
    coeffs[1] = b1 / a0;
    coeffs[2] = b2 / a0;
    coeffs[3] = a1 / a0;
    coeffs[4] = a2 / a0;
}

static void calcHighShelf(float *coeffs, float freq, float gainDB, float Q, float sampleRate) {
    float A  = powf(10.0f, gainDB / 40.0f);
    float w0 = 2.0f * M_PI * freq / sampleRate;
    float sinW0 = sinf(w0);
    float cosW0 = cosf(w0);
    float alpha = sinW0 / (2.0f * Q);
    float sqrtA2alpha = 2.0f * sqrtf(A) * alpha;
    
    float b0 = A * ((A + 1.0f) + (A - 1.0f) * cosW0 + sqrtA2alpha);
    float b1 = -2.0f * A * ((A - 1.0f) + (A + 1.0f) * cosW0);
    float b2 = A * ((A + 1.0f) + (A - 1.0f) * cosW0 - sqrtA2alpha);
    float a0 = (A + 1.0f) - (A - 1.0f) * cosW0 + sqrtA2alpha;
    float a1 = 2.0f * ((A - 1.0f) - (A + 1.0f) * cosW0);
    float a2 = (A + 1.0f) - (A - 1.0f) * cosW0 - sqrtA2alpha;
    
    coeffs[0] = b0 / a0;
    coeffs[1] = b1 / a0;
    coeffs[2] = b2 / a0;
    coeffs[3] = a1 / a0;
    coeffs[4] = a2 / a0;
}

// Recalculate all coefficients for the inactive buffer, then swap
static void recalcAllEQCoeffs(TapContext *context) {
    int inactiveBuf = 1 - context->activeCoeffBuffer;
    float sr = context->sampleRate;
    if (sr < 1.0f) sr = 44100.0f;
    
    for (int i = 0; i < EQ_NUM_BANDS; i++) {
        float gain = context->eqGains[i];
        float freq = EQ_FREQ_TABLE[i];
        float Q = EQ_Q_TABLE[i];
        
        // Clamp frequency to Nyquist
        if (freq >= sr * 0.499f) freq = sr * 0.499f;
        
        if (fabsf(gain) < 0.1f) {
            // Unity passthrough — skip filter for this band
            context->eqCoeffs[inactiveBuf][i][0] = 1.0f;
            context->eqCoeffs[inactiveBuf][i][1] = 0.0f;
            context->eqCoeffs[inactiveBuf][i][2] = 0.0f;
            context->eqCoeffs[inactiveBuf][i][3] = 0.0f;
            context->eqCoeffs[inactiveBuf][i][4] = 0.0f;
        } else if (i == 0) {
            calcLowShelf(context->eqCoeffs[inactiveBuf][i], freq, gain, Q, sr);
        } else if (i == EQ_NUM_BANDS - 1) {
            calcHighShelf(context->eqCoeffs[inactiveBuf][i], freq, gain, Q, sr);
        } else {
            calcPeakingEQ(context->eqCoeffs[inactiveBuf][i], freq, gain, Q, sr);
        }
    }
    
    // Atomic swap — audio thread will pick up new coefficients on next callback
    __sync_synchronize(); // Memory barrier
    context->activeCoeffBuffer = inactiveBuf;
}

static void tapFinalize(MTAudioProcessingTapRef tap) {
    TapContext *context = (TapContext *)MTAudioProcessingTapGetStorage(tap);
    if (context) {
        @synchronized ([QobuzAudioPlugin class]) {
            if (g_tapContext == context) {
                g_tapContext = NULL; // Prevent dangling pointer crashes!
            }
        }
        vDSP_destroy_fftsetup(context->fftSetup);
        free(context->window);
        free(context->realBuffer);
        free(context->imagBuffer);
        free(context->magnitudes);
        free(context);
    }
}

static void tapPrepare(MTAudioProcessingTapRef tap, CMItemCount maxFrames, const AudioStreamBasicDescription *processingFormat) {
    TapContext *context = (TapContext *)MTAudioProcessingTapGetStorage(tap);
    if (context && processingFormat) {
        context->sampleRate = (float)processingFormat->mSampleRate;
        context->numChannels = ((int)processingFormat->mChannelsPerFrame < EQ_MAX_CHANNELS) ? (int)processingFormat->mChannelsPerFrame : EQ_MAX_CHANNELS;
        context->isNonInterleaved = (processingFormat->mFormatFlags & kAudioFormatFlagIsNonInterleaved) != 0;
        
        // Recalculate EQ coefficients with actual sample rate safely
        @synchronized ([QobuzAudioPlugin class]) {
            recalcAllEQCoeffs(context);
        }
    }
}
static void tapUnprepare(MTAudioProcessingTapRef tap) {}

static void tapProcess(MTAudioProcessingTapRef tap, CMItemCount numberFrames, MTAudioProcessingTapFlags flags, AudioBufferList *bufferListInOut, CMItemCount *numberFramesOut, MTAudioProcessingTapFlags *flagsOut) {
    
    OSStatus status = MTAudioProcessingTapGetSourceAudio(tap, numberFrames, bufferListInOut, flagsOut, NULL, numberFramesOut);
    if (status != noErr) return;
    
    TapContext *context = (TapContext *)MTAudioProcessingTapGetStorage(tap);
    if (!context) return;
    
    // ── EQ Biquad Processing (runs on EVERY audio callback, not throttled) ──
    // This must process every sample for gapless audio filtering
    if (context->eqEnabled) {
        int activeBuf = context->activeCoeffBuffer;
        int numCh = context->numChannels;
        
        if (context->isNonInterleaved) {
            // Non-interleaved: One buffer per channel, numberFrames samples per buffer
            int maxCh = ((int)bufferListInOut->mNumberBuffers < numCh) ? (int)bufferListInOut->mNumberBuffers : numCh;
            for (int ch = 0; ch < maxCh; ch++) {
                float *channelData = (float *)bufferListInOut->mBuffers[ch].mData;
                if (!channelData) continue;
                
                for (int band = 0; band < EQ_NUM_BANDS; band++) {
                    float *coeffs = context->eqCoeffs[activeBuf][band];
                    if (coeffs[0] == 1.0f && coeffs[1] == 0.0f && coeffs[2] == 0.0f &&
                        coeffs[3] == 0.0f && coeffs[4] == 0.0f) continue;
                    
                    float b0 = coeffs[0], b1 = coeffs[1], b2 = coeffs[2];
                    float a1 = coeffs[3], a2 = coeffs[4];
                    float z1 = context->eqDelayState[ch][band][0];
                    float z2 = context->eqDelayState[ch][band][1];
                    
                    for (UInt32 n = 0; n < numberFrames; n++) {
                        float x = channelData[n];
                        float y = b0 * x + z1;
                        z1 = b1 * x - a1 * y + z2;
                        z2 = b2 * x - a2 * y;
                        channelData[n] = y;
                    }
                    
                    if (fabsf(z1) < 1.0e-15f) z1 = 0.0f;
                    if (fabsf(z2) < 1.0e-15f) z2 = 0.0f;
                    context->eqDelayState[ch][band][0] = z1;
                    context->eqDelayState[ch][band][1] = z2;
                }
                
                // Safety soft/hard clip per channel to prevent digital distortion overflow
                for (UInt32 n = 0; n < numberFrames; n++) {
                    channelData[n] = fmaxf(-1.0f, fminf(1.0f, channelData[n]));
                }
            }
        } else {
            // Interleaved: Single buffer, channels are adjacent (L, R, L, R...)
            float *interleavedData = (float *)bufferListInOut->mBuffers[0].mData;
            if (interleavedData) {
                for (int band = 0; band < EQ_NUM_BANDS; band++) {
                    float *coeffs = context->eqCoeffs[activeBuf][band];
                    if (coeffs[0] == 1.0f && coeffs[1] == 0.0f && coeffs[2] == 0.0f &&
                        coeffs[3] == 0.0f && coeffs[4] == 0.0f) continue;
                    
                    float b0 = coeffs[0], b1 = coeffs[1], b2 = coeffs[2];
                    float a1 = coeffs[3], a2 = coeffs[4];
                    
                    // We must process frames, pulling the correct channel sample
                    for (int ch = 0; ch < numCh; ch++) {
                        float z1 = context->eqDelayState[ch][band][0];
                        float z2 = context->eqDelayState[ch][band][1];
                        
                        for (UInt32 n = 0; n < numberFrames; n++) {
                            int idx = n * numCh + ch;
                            float x = interleavedData[idx];
                            float y = b0 * x + z1;
                            z1 = b1 * x - a1 * y + z2;
                            z2 = b2 * x - a2 * y;
                            interleavedData[idx] = y;
                        }
                        
                        if (fabsf(z1) < 1.0e-15f) z1 = 0.0f;
                        if (fabsf(z2) < 1.0e-15f) z2 = 0.0f;
                        context->eqDelayState[ch][band][0] = z1;
                        context->eqDelayState[ch][band][1] = z2;
                    }
                }
                
                // Safety clip for interleaved data
                UInt32 totalSamples = numberFrames * numCh;
                for (UInt32 i = 0; i < totalSamples; i++) {
                    interleavedData[i] = fmaxf(-1.0f, fminf(1.0f, interleavedData[i]));
                }
            }
        }
    }
    
    // ── FFT Analysis (throttled to ~30fps for visualization only) ──
    if (numberFrames < context->fftSize) return;
    
    QobuzAudioPlugin *plugin = (__bridge QobuzAudioPlugin *)context->plugin;
    if (!plugin.isPlaying) return;
    
    NSTimeInterval now = [[NSDate date] timeIntervalSince1970];
    if (now - plugin.lastFftUpdate < 0.033) return; // approx 30fps
    
    float *samples = (float *)bufferListInOut->mBuffers[0].mData;
    if (!samples) return;
    
    int halfSize = context->fftSize / 2;
    float windowedBuffer[FFT_SIZE];
    
    // If interleaved, stride by numChannels to extract only the Left channel for FFT
    vDSP_Stride stride = context->isNonInterleaved ? 1 : context->numChannels;
    
    vDSP_vmul(samples, stride, context->window, 1, windowedBuffer, 1, (vDSP_Length)context->fftSize);
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
        
        int scaled = (int)(val * 255.0);
        if (scaled < 0) scaled = 0;
        if (scaled > 255) scaled = 255;
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

// ═══════════════════════════════════════════════════════════
// ── PARAMETRIC EQUALIZER METHODS ──
// ═══════════════════════════════════════════════════════════

- (void)setEQEnabled:(CAPPluginCall *)call {
    BOOL enabled = [[call getBool:@"enabled" defaultValue:@NO] boolValue];
    
    @synchronized ([QobuzAudioPlugin class]) {
        if (g_tapContext) {
            g_tapContext->eqEnabled = enabled;
            // Clear delay state to prevent audio artifacts when toggling
            memset(g_tapContext->eqDelayState, 0, sizeof(g_tapContext->eqDelayState));
        }
    }
    
    // Persist
    [[NSUserDefaults standardUserDefaults] setBool:enabled forKey:@"eq_enabled"];
    [[NSUserDefaults standardUserDefaults] synchronize];
    
    [self logMessage:[NSString stringWithFormat:@"🎛️ EQ %@", enabled ? @"ENABLED" : @"DISABLED"]];
    [call resolve];
}

- (void)setEQBand:(CAPPluginCall *)call {
    NSNumber *bandNum = call.options[@"band"];
    NSNumber *gainNum = call.options[@"gain"];
    
    if (!bandNum || !gainNum) {
        [call reject:@"Missing band or gain"];
        return;
    }
    
    int band = [bandNum intValue];
    float gain = [gainNum floatValue];
    
    if (band < 0 || band >= EQ_NUM_BANDS) {
        [call reject:@"Band out of range (0-9)"];
        return;
    }
    
    // Clamp gain to ±12 dB
    gain = fmaxf(-12.0f, fminf(12.0f, gain));
    
    @synchronized ([QobuzAudioPlugin class]) {
        if (g_tapContext) {
            g_tapContext->eqGains[band] = gain;
            recalcAllEQCoeffs(g_tapContext);
            self.eqPresetName = @"custom";
            [self persistEQGains];
        } else {
            // Player is stopped, save directly to UserDefaults
            NSMutableArray *savedGains = [[[NSUserDefaults standardUserDefaults] arrayForKey:@"eq_gains"] mutableCopy] ?: [NSMutableArray arrayWithCapacity:EQ_NUM_BANDS];
            if (savedGains.count < EQ_NUM_BANDS) {
                for (int i = (int)savedGains.count; i < EQ_NUM_BANDS; i++) [savedGains addObject:@0];
            }
            savedGains[band] = @(gain);
            [[NSUserDefaults standardUserDefaults] setObject:savedGains forKey:@"eq_gains"];
            self.eqPresetName = @"custom";
            [[NSUserDefaults standardUserDefaults] synchronize];
        }
    }
    
    [call resolve];
}

- (void)setEQPreset:(CAPPluginCall *)call {
    NSString *preset = call.options[@"preset"];
    if (!preset) {
        [call reject:@"Missing preset name"];
        return;
    }
    
    NSDictionary *presets = @{
        @"flat":        @[@0, @0, @0, @0, @0, @0, @0, @0, @0, @0],
        @"bass_boost":  @[@6, @5, @3, @1, @0, @0, @0, @0, @0, @0],
        @"treble_boost": @[@0, @0, @0, @0, @0, @0, @1, @3, @5, @6],
        @"vocal":       @[@(-2), @(-1), @0, @2, @4, @4, @2, @0, @(-1), @(-2)],
        @"rock":        @[@4, @3, @0, @(-2), @(-1), @1, @3, @4, @4, @3],
        @"jazz":        @[@3, @2, @0, @1, @(-1), @0, @1, @2, @3, @4],
        @"electronic":  @[@5, @4, @1, @0, @(-2), @0, @1, @3, @4, @5],
        @"acoustic":    @[@0, @0, @1, @2, @1, @0, @1, @2, @3, @2],
        @"late_night":  @[@3, @2, @0, @0, @1, @1, @0, @(-1), @(-2), @(-3)],
        @"hires":       @[@(-1), @0, @0, @0, @0, @0, @1, @2, @3, @4],
    };
    
    NSArray *gains = presets[preset];
    if (!gains) {
        [call reject:[NSString stringWithFormat:@"Unknown preset: %@", preset]];
        return;
    }
    
    @synchronized ([QobuzAudioPlugin class]) {
        if (g_tapContext) {
            for (int i = 0; i < EQ_NUM_BANDS; i++) {
                g_tapContext->eqGains[i] = [gains[i] floatValue];
            }
            recalcAllEQCoeffs(g_tapContext);
            memset(g_tapContext->eqDelayState, 0, sizeof(g_tapContext->eqDelayState));
            [self persistEQGains];
        } else {
            [[NSUserDefaults standardUserDefaults] setObject:gains forKey:@"eq_gains"];
        }
        self.eqPresetName = preset;
        [[NSUserDefaults standardUserDefaults] setObject:preset forKey:@"eq_preset"];
        [[NSUserDefaults standardUserDefaults] synchronize];
    }
    
    [self logMessage:[NSString stringWithFormat:@"🎛️ EQ Preset: %@", preset]];
    [call resolve:@{@"gains": gains}];
}

- (void)getEQState:(CAPPluginCall *)call {
    NSMutableArray *gains = [NSMutableArray arrayWithCapacity:EQ_NUM_BANDS];
    BOOL enabled = [[NSUserDefaults standardUserDefaults] boolForKey:@"eq_enabled"];
    NSString *preset = self.eqPresetName ?: [[NSUserDefaults standardUserDefaults] stringForKey:@"eq_preset"] ?: @"flat";
    
    @synchronized ([QobuzAudioPlugin class]) {
        if (g_tapContext) {
            enabled = g_tapContext->eqEnabled;
            for (int i = 0; i < EQ_NUM_BANDS; i++) {
                [gains addObject:@(g_tapContext->eqGains[i])];
            }
        } else {
            NSArray *savedGains = [[NSUserDefaults standardUserDefaults] arrayForKey:@"eq_gains"];
            if (savedGains && savedGains.count == EQ_NUM_BANDS) {
                [gains addObjectsFromArray:savedGains];
            } else {
                for (int i = 0; i < EQ_NUM_BANDS; i++) {
                    [gains addObject:@0];
                }
            }
        }
    }
    
    [call resolve:@{
        @"enabled": @(enabled),
        @"gains": gains,
        @"preset": preset
    }];
}

- (void)persistEQGains {
    @synchronized ([QobuzAudioPlugin class]) {
        if (!g_tapContext) return; // If null, the caller must handle UserDefaults manually
        
        NSMutableArray *gains = [NSMutableArray arrayWithCapacity:EQ_NUM_BANDS];
        for (int i = 0; i < EQ_NUM_BANDS; i++) {
            [gains addObject:@(g_tapContext->eqGains[i])];
        }
        [[NSUserDefaults standardUserDefaults] setObject:gains forKey:@"eq_gains"];
        [[NSUserDefaults standardUserDefaults] synchronize];
    }
}

@end

// --- LIQUID TAB BAR PLUGIN REGISTRATION ---
// Appended to this compiled .m file to ensure registration occurs

CAP_PLUGIN(LiquidTabBarPlugin, "LiquidTabBar",
    CAP_PLUGIN_METHOD(initializeTabBar, CAPPluginReturnPromise);
    CAP_PLUGIN_METHOD(updateTab, CAPPluginReturnPromise);
)
