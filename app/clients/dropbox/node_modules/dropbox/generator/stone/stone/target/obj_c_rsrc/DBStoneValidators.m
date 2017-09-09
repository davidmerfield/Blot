///
/// Copyright (c) 2016 Dropbox, Inc. All rights reserved.
///

#import "DBStoneValidators.h"

@implementation DBStoneValidators

+ (void (^)(NSString *))stringValidator:(NSNumber *)minLength
                              maxLength:(NSNumber *)maxLength
                                pattern:(NSString *)pattern {

  void (^validator)(NSString *) = ^(NSString * value) {
     __unused NSUInteger length = [value length];

    if (minLength) {
        __unused NSString *message =
          [NSString stringWithFormat:@"\"%@\" must be at least %@ characters", value, [minLength stringValue]];
      NSAssert(length >= [minLength unsignedIntegerValue], message);
    }

    if (maxLength) {
       __unused NSString *message =
          [NSString stringWithFormat:@"\"%@\" must be at most %@ characters", value, [maxLength stringValue]];
      NSAssert(length <= [maxLength unsignedIntegerValue], message);
    }

    if (pattern && pattern.length != 0) {
      NSError *error;
      NSRegularExpression *re = [NSRegularExpression regularExpressionWithPattern:pattern options:0 error:&error];
      __unused NSArray *matches = [re matchesInString:value options:0 range:NSMakeRange(0, [value length])];
      __unused NSString *message = [NSString stringWithFormat:@"\"%@\" must match pattern \"%@\"", value, [re pattern]];
      NSAssert([matches count] > 0, message);
    }
  };

  return validator;
}

+ (void (^)(NSNumber *))numericValidator:(NSNumber *)minValue maxValue:(NSNumber *)maxValue {
  void (^validator)(NSNumber *) = ^(NSNumber * value) {
    if (minValue) {
      __unused NSString *message = [NSString stringWithFormat:@"\"%@\" must be at least %@", value, [minValue stringValue]];
      NSAssert([value unsignedIntegerValue] >= [minValue unsignedIntegerValue], message);
    }

    if (maxValue) {
      __unused NSString *message = [NSString stringWithFormat:@"\"%@\" must be at most %@", value, [maxValue stringValue]];
      NSAssert([value unsignedIntegerValue] <= [maxValue unsignedIntegerValue], message);
    }
  };

  return validator;
}

+ (void (^)(NSArray<id> *))arrayValidator:(NSNumber *)minItems
                                 maxItems:(NSNumber *)maxItems
                            itemValidator:(void (^)(id))itemValidator {
  void (^validator)(NSArray<id> *) = ^(NSArray<id> * value) {
    __unused NSUInteger count = [value count];

    if (minItems) {
      __unused NSString *message =
          [NSString stringWithFormat:@"\"%@\" must be at least %@ items", value, [minItems stringValue]];
      NSAssert(count >= [minItems unsignedIntegerValue], message);
    }

    if (maxItems) {
      __unused NSString *message = [NSString stringWithFormat:@"\"%@\" must be at most %@ items", value, [maxItems stringValue]];
      NSAssert(count <= [maxItems unsignedIntegerValue], message);
    }

    if (itemValidator) {
      for (id item in value) {
        itemValidator(item);
      }
    }
  };

  return validator;
}

+ (void (^_Nonnull)(id))nullableValidator:(void (^_Nonnull)(id))internalValidator {
  void (^validator)(NSNumber *) = ^(NSNumber * value) {
    if (value) {
      internalValidator(value);
    }
  };

  return validator;
}

@end
