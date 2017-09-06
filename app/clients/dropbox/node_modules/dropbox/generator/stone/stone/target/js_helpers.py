from __future__ import absolute_import, division, print_function, unicode_literals

import json
import six

from stone.data_type import (
    Boolean,
    Bytes,
    Float32,
    Float64,
    Int32,
    Int64,
    List,
    String,
    Timestamp,
    UInt32,
    UInt64,
    Void,
    is_list_type,
    is_struct_type,
    is_user_defined_type,
)
from stone.target.helpers import (
    fmt_camel,
    fmt_pascal,
)

_base_type_table = {
    Boolean: 'boolean',
    Bytes: 'string',
    Float32: 'number',
    Float64: 'number',
    Int32: 'number',
    Int64: 'number',
    List: 'Array',
    String: 'string',
    UInt32: 'number',
    UInt64: 'number',
    Timestamp: 'Timestamp',
    Void: 'void',
}


def fmt_obj(o):
    if isinstance(o, six.text_type):
        # Prioritize single-quoted strings per JS style guides.
        return repr(o).lstrip('u')
    else:
        return json.dumps(o, indent=2)


def fmt_error_type(data_type):
    """
    Converts the error type into a JSDoc type.
    """
    return 'Error.<%s>' % fmt_type(data_type)


def fmt_type_name(data_type):
    """
    Returns the JSDoc name for the given data type.
    (Does not attempt to enumerate subtypes.)
    """
    if is_user_defined_type(data_type):
        return fmt_pascal('%s%s' % (data_type.namespace.name, data_type.name))
    else:
        fmted_type = _base_type_table.get(data_type.__class__, 'Object')
        if is_list_type(data_type):
            fmted_type += '.<' + fmt_type(data_type.data_type) + '>'
        return fmted_type


def fmt_type(data_type):
    """
    Returns a JSDoc annotation for a data type.
    May contain a union of enumerated subtypes.
    """
    if is_struct_type(data_type) and data_type.has_enumerated_subtypes():
        possible_types = []
        possible_subtypes = data_type.get_all_subtypes_with_tags()
        for _, subtype in possible_subtypes:
            possible_types.append(fmt_type_name(subtype))
        if data_type.is_catch_all():
            possible_types.append(fmt_type_name(data_type))
        return fmt_jsdoc_union(possible_types)
    else:
        return fmt_type_name(data_type)


def fmt_jsdoc_union(type_strings):
    """
    Returns a JSDoc union of the given type strings.
    """
    return '(' + '|'.join(type_strings) + ')' if len(type_strings) > 1 else type_strings[0]


def fmt_func(name):
    return fmt_camel(name)


def fmt_var(name):
    return fmt_camel(name)
