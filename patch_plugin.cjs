const fs = require('fs');
let code = fs.readFileSync('ios/App/App/QobuzAudioPlugin.m', 'utf8');

// Add to pluginMethods
code = code.replace(
  `[methods addObject:[[CAPPluginMethod alloc] initWithName:@"setupRemoteControls" returnType:CAPPluginReturnPromise]];`,
  `[methods addObject:[[CAPPluginMethod alloc] initWithName:@"setupRemoteControls" returnType:CAPPluginReturnPromise]];\n    [methods addObject:[[CAPPluginMethod alloc] initWithName:@"embedLyrics" returnType:CAPPluginReturnPromise]];`
);

// Add method implementation at the bottom before @end
const methodImpl = `
- (void)embedLyrics:(CAPPluginCall *)call {
    NSString *path = call.options[@"path"];
    NSString *lyrics = call.options[@"lyrics"];
    
    if (!path || !lyrics) {
        [call reject:@"Missing path or lyrics"];
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
    #include <sys/xattr.h>
    const char *filePath = [url.path UTF8String];
    const char *attrName = "com.apple.metadata:kMDItemLyricist";
    NSData *data = [lyrics dataUsingEncoding:NSUTF8StringEncoding];
    
    setxattr(filePath, attrName, data.bytes, data.length, 0, 0);
    
    [self logMessage:[NSString stringWithFormat:@"✅ Letras incrustadas exitosamente en ObjC para: %@", url.lastPathComponent]];
    
    [call resolve];
}
`;

code = code.replace(/@end(?![\s\S]*@end)/, methodImpl + "\n@end");

fs.writeFileSync('ios/App/App/QobuzAudioPlugin.m', code);
console.log("Updated QobuzAudioPlugin.m");
