const fs = require('fs');
let code = fs.readFileSync('ios/App/App/QobuzAudioPlugin.m', 'utf8');

code = code.replace(/if \(!nowPlayingInfo\) nowPlayingInfo = \[NSMutableDictionary dictionary\];/, "if (!nowPlayingInfo) nowPlayingInfo = [NSMutableDictionary dictionary];");

// The async image callback
const asyncBlockOld = `NSMutableDictionary *info = [[MPNowPlayingInfoCenter defaultCenter].nowPlayingInfo mutableCopy];
                                if (!info) return;
                                info[MPMediaItemPropertyArtwork] = artwork;`;

const asyncBlockNew = `NSMutableDictionary *info = [[MPNowPlayingInfoCenter defaultCenter].nowPlayingInfo mutableCopy];
                                if (!info) info = [NSMutableDictionary dictionary];
                                info[MPMediaItemPropertyArtwork] = artwork;`;

code = code.replace(asyncBlockOld, asyncBlockNew);

fs.writeFileSync('ios/App/App/QobuzAudioPlugin.m', code);
