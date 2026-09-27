#import <Foundation/Foundation.h>
#import <AVFoundation/AVFoundation.h>
#import <Capacitor/Capacitor.h>

@interface QobuzAudioPlugin : CAPPlugin

@property (nonatomic, strong) AVPlayer *player;
@property (nonatomic, assign) BOOL isPlaying;
@property (nonatomic, assign) BOOL globalFftEnabled;
@property (nonatomic, assign) NSTimeInterval lastFftUpdate;
@property (nonatomic, strong) id errorLogObservation;
@property (nonatomic, strong) id timeObserver;
@property (nonatomic, strong) id endObservation;
@property (nonatomic, copy) NSString *eqPresetName;

// ── Parametric Equalizer Methods ──
- (void)setEQEnabled:(CAPPluginCall *)call;
- (void)setEQBand:(CAPPluginCall *)call;
- (void)setEQPreset:(CAPPluginCall *)call;
- (void)getEQState:(CAPPluginCall *)call;
- (void)setPreampGain:(CAPPluginCall *)call;
- (void)setEQPreamp:(CAPPluginCall *)call;

// ── Active Crossover (High-Pass Filter) Methods ──
- (void)setCrossoverEnabled:(CAPPluginCall *)call;
- (void)setCrossoverFrequency:(CAPPluginCall *)call;
- (void)setCrossover:(CAPPluginCall *)call;
- (void)getCrossoverState:(CAPPluginCall *)call;

@end
