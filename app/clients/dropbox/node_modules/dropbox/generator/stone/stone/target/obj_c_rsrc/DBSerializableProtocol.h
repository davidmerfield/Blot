///
/// Copyright (c) 2016 Dropbox, Inc. All rights reserved.
///

#import <Foundation/Foundation.h>

NS_ASSUME_NONNULL_BEGIN

///
/// Protocol which all Obj-C SDK API route objects must implement, otherwise a compiler-warning
/// is generated.
///
@protocol DBSerializable <NSObject>

///
/// Class method which returns a json-compatible dictionary representation of the
/// supplied object.
///
/// @param instance An instance of the API object to be serialized.
///
/// @return A serialized, json-compatible dictionary representation of the API object.
///
+ (NSDictionary *)serialize:(id)instance;

///
/// Class method which returns an instantiation of the supplied object as represented
/// by a json-compatible dictionary.
///
/// @param dict A dictionary representation of the API object to be serialized.
///
/// @return A deserialized, instantiation of the API object.
///
+ (id)deserialize:(NSDictionary *)dict;

///
/// Description method.
///
/// @return A human-readable representation of the current object.
///
- (NSString *)description;

@end

NS_ASSUME_NONNULL_END
