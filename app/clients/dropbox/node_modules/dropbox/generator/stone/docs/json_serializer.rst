***************
JSON Serializer
***************

Code generators include a JSON serializer which will convert a target
language's representation of Stone data types into JSON. This document explores
how Stone data types, regardless of language, are mapped to JSON.

Primitive Types
===============

========================== ====================================================
Stone Primitive            JSON Representation
========================== ====================================================
Boolean                    Boolean
Bytes                      String: Base64-encoded
Float{32,64}               Number
Int{32,64}, UInt{32,64}    Number
List                       Array
String                     String
Timestamp                  String: Encoded using strftime() based on the
                           Timestamp's format argument.
Void                       Null
========================== ====================================================

Struct
======

A struct is represented as a JSON object. Each specified field has a key in the
object. For example::

    struct Coordinate
        x Int64
        y Int64


converts to::

    {
     "x": 1,
     "y": 2
    }

If an optional (has a default or is nullable) field is not specified, the key
should be omitted. For example, given the following spec::

    struct SurveyAnswer
        age Int64
        name String = "John Doe"
        address String?

If ``name`` and ``address`` are unset and ``age`` is 28, then the struct
serializes to::

    {
     "age": 28
    }

Setting ``name`` or ``address`` to ``null`` is not a valid serialization;
deserializers will raise an error.

An explicit ``null`` is allowed for fields with nullable types. While it's
less compact, this makes serialization easier in some languages. The previous
example could therefore be represented as::

    {
     "age": 28,
     "address": null
    }

Enumerated Subtypes
-------------------

A struct that enumerates subtypes serializes similarly to a regular struct,
but includes a ``.tag`` key to distinguish the type. Here's an example to
demonstrate::

    struct A
        union*
            b B
            c C
        w Int64

    struct B extends A
        x Int64

    struct C extends A
        y Int64

Serializing ``A`` when it contains a struct ``B`` (with values of ``1`` for
each field) appears as::

    {
     ".tag": "b",
     "w": 1,
     "x": 1
    }

If the recipient receives a tag it cannot match to a type, it should fallback
to the parent type if it's specified as a catch-all.

For example::

    {
     ".tag": "d",
     "w": 1,
     "z": 1
    }

Because ``d`` is unknown, the recipient checks that struct ``A`` is a
catch-all. Since it is, it deserializes the message to an ``A`` object.

Union
=====

Let's use the following example to illustrate how a union is serialized::

    union U
        singularity
        number Int64
        coord Coordinate?

    struct Coordinate
        x Int64
        y Int64

The serialization of ``U`` with tag ``singularity`` is::

    {
     ".tag": "singularity"
    }

The ``.tag`` key makes it easy for a recipient to immediately determine the
selected union member.

For a union member of primitive type (``number`` in the example), the
serialization is as follows::

    {
     ".tag": "number",
     "number": 42
    }

Note that ``number`` is used as the value for ``.tag`` and as a key to hold
the value. This same pattern is used for union members with types that are
other unions or structs with enumerated subtypes.

Union members that are structs that do no enumerate subtypes (``coord`` in the
example) serialize as the struct with the addition of a ``.tag`` key. For
example, the serialization of ``Coordinate`` is::

    {
     "x": 1,
     "y": 2
    }

The serialization of ``U`` with tag ``coord`` is::

    {
     ".tag": "coord",
     "x": 1,
     "y": 2
    }

Nullable
^^^^^^^^

Note that ``coord`` references a nullable type. If it's unset, then the
serialization only includes the tag::

    {
     ".tag": "coord"
    }

You may notice that if ``Coordinate`` was defined to have no fields, it is
impossible to differentiate between an unset value and a value of coordinate.
In these cases, we prescribe that the deserializer should return a null
or unset value.

Compact Form
^^^^^^^^^^^^

Deserializers should support an additional representation of void union
members: the tag itself as a string. For example, tag ``singularity`` could
be serialized as simply::

    "singularity"

This is convenient for humans manually entering the argument, allowing them to
avoid typing an extra layer of JSON object nesting.
