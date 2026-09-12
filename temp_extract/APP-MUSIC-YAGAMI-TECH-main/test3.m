#import <Foundation/Foundation.h>
@interface CAPPlugin : NSObject
@end
@interface MyPlugin : CAPPlugin
@end

// Macro expansion
@interface MyPlugin : NSObject
@end
