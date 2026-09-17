const fs = require('fs');
let code = fs.readFileSync('./ios/App/App/QobuzAudioPlugin.m', 'utf8');

const target = `weakSelf.endObservation = [[NSNotificationCenter defaultCenter] addObserverForName:AVPlayerItemDidPlayToEndTimeNotification object:playerItem queue:[NSOperationQueue mainQueue] usingBlock:^(NSNotification * _Nonnull note) {
            [weakSelf notifyListeners:@"onEnded" data:@{}];
            [weakSelf logMessage:@"🏁 Pista terminada nativamente. Emitiendo onEnded a JS."];
        }];`;

const replacement = `weakSelf.endObservation = [[NSNotificationCenter defaultCenter] addObserverForName:AVPlayerItemDidPlayToEndTimeNotification object:playerItem queue:[NSOperationQueue mainQueue] usingBlock:^(NSNotification * _Nonnull note) {
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
        }];`;

if (code.includes(target)) {
    code = code.replace(target, replacement);
    fs.writeFileSync('./ios/App/App/QobuzAudioPlugin.m', code);
    console.log("Patched QobuzAudioPlugin.m");
} else {
    console.log("Target block not found");
}
