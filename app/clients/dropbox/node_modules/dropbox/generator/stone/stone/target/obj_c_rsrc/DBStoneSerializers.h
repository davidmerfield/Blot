///
/// Copyright (c) 2016 Dropbox, Inc. All rights reserved.
///

#import <Foundation/Foundation.h>

#import "DBSerializableProtocol.h"

NS_ASSUME_NONNULL_BEGIN

///
/// Category to ensure `NSArray` class "implements" `DBSerializable` protocol, which is
/// required for all Obj-C SDK API route arguments. This avoids a compiler warning for
/// `NSArray` route arguments.
///
@interface NSArray (DBSerializable) <DBSerializable>

+ (NSDictionary *)serialize:(id)obj;

+ (id)deserialize:(NSDictionary *)dict;

@end

///
/// Category to ensure `NSString` class "implements" `DBSerializable` protocol, which is
/// required for all Obj-C SDK API route arguments. This avoids a compiler warning for
/// `NSString` route arguments.
///
@interface NSString (DBSerializable) <DBSerializable>

+ (NSDictionary *)serialize:(id)obj;

+ (id)deserialize:(NSDictionary *)dict;

@end

///
/// Serializer functions used by the SDK to serialize/deserialize `NSDate` types.
///
@interface DBNSDateSerializer : NSObject

/// Returns a json-compatible `NSString` that represents an `NSDate` type based on the supplied
/// `NSDate` object and date format string.
+ (NSString *)serialize:(NSDate *)value dateFormat:(NSString *)dateFormat;

/// Returns an `NSDate` object from the supplied `NSString`-representation of an `NSDate` object and
/// the supplied date format string.
+ (NSDate *)deserialize:(NSString *)value dateFormat:(NSString *)dateFormat;

@end

///
/// Serializer functions used by the SDK to serialize/deserialize `NSArray` types.
///
@interface DBArraySerializer : NSObject

/// Applies a serialization block to each element in the array and returns a new array with
/// all elements serialized. The serialization block either serializes the object, or if the
/// object is a wrapper for a primitive type, it leaves it unchanged.
+ (NSArray *)serialize:(NSArray *)value withBlock:(id (^_Nonnull)(id))serializeBlock;

/// Applies a deserialization block to each element in the array and returns a new array with
/// all elements deserialized. The serialization block either deserializes the object, or if the
/// object is a wrapper for a primitive type, it leaves it unchanged.
+ (NSArray *)deserialize:(NSArray *)jsonData
                       withBlock:(id (^_Nonnull)(id))deserializeBlock;

@end

NS_ASSUME_NONNULL_END
