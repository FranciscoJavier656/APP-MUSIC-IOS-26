const fs = require('fs');
let code = fs.readFileSync('./ios/App/App/QobuzAudioPlugin.m', 'utf8');

const replacementFunc = (name) => {
    return `__block UIBackgroundTaskIdentifier bgTask = [[UIApplication sharedApplication] beginBackgroundTaskWithExpirationHandler:^{
                [[UIApplication sharedApplication] endBackgroundTask:bgTask];
                bgTask = UIBackgroundTaskInvalid;
            }];
            [self notifyListeners:@"${name}" data:@{}];
            dispatch_after(dispatch_time(DISPATCH_TIME_NOW, (int64_t)(5.0 * NSEC_PER_SEC)), dispatch_get_main_queue(), ^{
                if (bgTask != UIBackgroundTaskInvalid) {
                    [[UIApplication sharedApplication] endBackgroundTask:bgTask];
                }
            });`;
};

code = code.replace(`[self notifyListeners:@"onRemoteNext" data:@{}];`, replacementFunc("onRemoteNext"));
code = code.replace(`[self notifyListeners:@"onRemotePrev" data:@{}];`, replacementFunc("onRemotePrev"));
code = code.replace(`[self notifyListeners:@"onRemotePlay" data:@{}];`, replacementFunc("onRemotePlay"));
code = code.replace(`[self notifyListeners:@"onRemotePause" data:@{}];`, replacementFunc("onRemotePause"));

fs.writeFileSync('./ios/App/App/QobuzAudioPlugin.m', code);
console.log("Patched remote commands");
