from __future__ import absolute_import, division, print_function, unicode_literals

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
    is_alias,
    is_list_type,
    is_struct_type,
    is_user_defined_type,
)
from stone.target.helpers import (
    fmt_camel,
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


def fmt_error_type(data_type, inside_namespace=None):
    """
    Converts the error type into a TypeScript type.
    inside_namespace should be set to the namespace that the reference
    occurs in, or None if this parameter is not relevant.
    """
    return 'Error<%s>' % fmt_type(data_type, inside_namespace)

def fmt_type_name(data_type, inside_namespace=None):
    """
    Produces a TypeScript type name for the given data type.
    inside_namespace should be set to the namespace that the reference
    occurs in, or None if this parameter is not relevant.
    """
    if is_user_defined_type(data_type) or is_alias(data_type):
        if data_type.namespace == inside_namespace:
            return data_type.name
        else:
            return '%s.%s' % (data_type.namespace.name, data_type.name)
    else:
        fmted_type = _base_type_table.get(data_type.__class__, 'Object')
        if is_list_type(data_type):
            fmted_type += '<' + fmt_type(data_type.data_type, inside_namespace) + '>'
        return fmted_type

def fmt_polymorphic_type_reference(data_type, inside_namespace=None):
    """
    Produces a TypeScript type name for the meta-type that refers to the given
    struct, which belongs to an enumerated subtypes tree. This meta-type contains the
    .tag field that lets developers discriminate between subtypes.
    """
    # NOTE: These types are not properly namespaced, so there could be a conflict
    #       with other user-defined types. If this ever surfaces as a problem, we
    #       can defer emitting these types until the end, and emit them in a
    #       nested namespace (e.g., files.references.MetadataReference).
    return fmt_type_name(data_type, inside_namespace) + "Reference"

def fmt_type(data_type, inside_namespace=None):
    """
    Returns a TypeScript type annotation for a data type.
    May contain a union of enumerated subtypes.
    inside_namespace should be set to the namespace that the type reference
    occurs in, or None if this parameter is not relevant.
    """
    if is_struct_type(data_type) and data_type.has_enumerated_subtypes():
        possible_types = []
        possible_subtypes = data_type.get_all_subtypes_with_tags()
        for _, subtype in possible_subtypes:
            possible_types.append(fmt_polymorphic_type_reference(subtype, inside_namespace))
        if data_type.is_catch_all():
            possible_types.append(fmt_polymorphic_type_reference(data_type, inside_namespace))
        return fmt_union(possible_types)
    else:
        return fmt_type_name(data_type, inside_namespace)

def fmt_union(type_strings):
    """
    Returns a union type of the given types.
    """
    return '|'.join(type_strings) if len(type_strings) > 1 else type_strings[0]

def fmt_func(name):
    return fmt_camel(name)

def fmt_var(name):
    return fmt_camel(name)

def fmt_tag(cur_namespace, tag, val):
    """
    Processes a documentation reference.
    """
    if tag == 'type':
        fq_val = val
        if '.' not in val and cur_namespace is not None:
            fq_val = cur_namespace.name + '.' + fq_val
        return fq_val
    elif tag == 'route':
        return fmt_func(val) + "()"
    elif tag == 'link':
        anchor, link = val.rsplit(' ', 1)
        # There's no way to have links in TSDoc, so simply use JSDoc's formatting.
        # It's entirely possible some editors support this.
        return '[%s]{@link %s}' % (anchor, link)
    elif tag == 'val':
        # Value types seem to match JavaScript (true, false, null)
        return val
    elif tag == 'field':
        return val
    else:
        raise RuntimeError('Unknown doc ref tag %r' % tag)
