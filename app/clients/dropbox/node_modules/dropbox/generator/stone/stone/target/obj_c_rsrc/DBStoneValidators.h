///
/// Copyright (c) 2016 Dropbox, Inc. All rights reserved.
///

#import <Foundation/Foundation.h>

NS_ASSUME_NONNULL_BEGIN

///
/// Validator functions used by SDK to impose value constraints.
///
@interface DBStoneValidators <T> : NSObject

/// Validator for `NSString` objects. Enforces minimum length and/or maximum length and/or regex pattern.
+ (void (^)(NSString *))stringValidator:(nullable NSNumber *)minLength
                                               maxLength:(nullable NSNumber *)maxLength
                                                 pattern:(nullable NSString *)pattern;

/// Validator for `NSNumber` objects. Enforces minimum value and/or maximum value.
+ (void (^)(NSNumber *))numericValidator:(nullable NSNumber *)minValue
                                                 maxValue:(nullable NSNumber *)maxValue;

/// Validator for `NSArray` objects. Enforces minimum number of items and/or maximum minimum number of items. Method
/// requires a validator block that can validate each item in the array.
+ (void (^)(NSArray<T> *))arrayValidator:(nullable NSNumber *)minItems
                                                 maxItems:(nullable NSNumber *)maxItems
                                            itemValidator:(void (^_Nullable)(T))itemValidator;

/// Wrapper validator for nullable objects. Maintains a reference to the object's normal non-nullable validator.
+ (void (^)(T))nullableValidator:(void (^)(T))internalValidator;

@end

NS_ASSUME_NONNULL_END
