///
/// Copyright (c) 2016 Dropbox, Inc. All rights reserved.
///

#import "DBStoneBase.h"

@implementation DBRoute

- (instancetype)init:(NSString *)name
            namespace_:(NSString *)namespace_
            deprecated:(NSNumber *)deprecated
            resultType:(Class<DBSerializable>)resultType
             errorType:(Class<DBSerializable>)errorType
                 attrs:(NSDictionary<NSString *, NSString *> *)attrs
      arraySerialBlock:(id(^)(id))arraySerialBlock
    arrayDeserialBlock:(id(^)(id))arrayDeserialBlock {
  self = [self init];
  if (self != nil) {
    _name = name;
    _namespace_ = namespace_;
    _deprecated = deprecated;
    _resultType = resultType;
    _errorType = errorType;
    _attrs = attrs;
    _arraySerialBlock = arraySerialBlock;
    _arrayDeserialBlock = arrayDeserialBlock;
  }
  return self;
}

@end

@implementation DBNilObject

@end
