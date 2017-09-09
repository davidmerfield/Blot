///
/// Copyright (c) 2016 Dropbox, Inc. All rights reserved.
///

import Foundation

// The objects in this file are used by generated code and should not need to be invoked manually.

open class Route<ASerial: JSONSerializer, RSerial: JSONSerializer, ESerial: JSONSerializer> {
    open let name: String
    open let namespace: String
    open let deprecated: Bool
    open let argSerializer: ASerial
    open let responseSerializer: RSerial
    open let errorSerializer: ESerial
    open let attrs: [String: String?]

    public init(name: String, namespace: String, deprecated: Bool, argSerializer: ASerial,
                responseSerializer: RSerial, errorSerializer: ESerial, attrs: [String: String?]) {
        self.name = name
        self.namespace = namespace
        self.deprecated = deprecated
        self.argSerializer = argSerializer
        self.responseSerializer = responseSerializer
        self.errorSerializer = errorSerializer
        self.attrs = attrs
    }
}
