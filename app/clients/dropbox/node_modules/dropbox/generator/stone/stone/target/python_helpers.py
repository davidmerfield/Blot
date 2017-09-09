from __future__ import absolute_import, division, print_function, unicode_literals

import pprint

from stone.api import ApiNamespace  # noqa: F401 # pylint: disable=unused-import
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
    is_user_defined_type,
    is_alias,
)
from stone.generator import Generator  # noqa: F401 # pylint: disable=unused-import
from stone.target.helpers import (
    fmt_pascal,
    fmt_underscores,
)

_type_table = {
    Boolean: 'bool',
    Bytes: 'bytes',
    Float32: 'float',
    Float64: 'float',
    Int32: 'int',
    Int64: 'long',
    List: 'list',
    String: 'str',
    Timestamp: 'datetime',
    UInt32: 'long',
    UInt64: 'long',
}

_reserved_keywords = {
    'break',
    'class',
    'continue',
    'for',
    'pass',
    'while',
}


def _rename_if_reserved(s):
    if s in _reserved_keywords:
        return s + '_'
    else:
        return s


def fmt_class(name, check_reserved=False):
    s = fmt_pascal(name)
    return _rename_if_reserved(s) if check_reserved else s


def fmt_func(name, check_reserved=False):
    s = fmt_underscores(name)
    return _rename_if_reserved(s) if check_reserved else s


def fmt_obj(o):
    return pprint.pformat(o, width=1)


def fmt_type(data_type):
    return _type_table.get(data_type.__class__, fmt_class(data_type.name))


def fmt_var(name, check_reserved=False):
    s = fmt_underscores(name)
    return _rename_if_reserved(s) if check_reserved else s

TYPE_IGNORE_COMMENT = "  # type: ignore"

def generate_imports_for_referenced_namespaces(generator, namespace, insert_type_ignore=False):
    # type: (Generator, ApiNamespace, bool) -> None
    """
    Both the true Python generator and the Python PEP 484 Type Stub generator have to perform the
    same imports.
    :param insert_type_ignore: add a MyPy type-ignore comment to the imports in the except: clause.
    """

    imported_namespaces = namespace.get_imported_namespaces()
    if not imported_namespaces:
        return

    type_ignore_comment = TYPE_IGNORE_COMMENT if insert_type_ignore else ""

    generator.emit('try:')
    with generator.indent():
        generator.emit('from . import (')
        with generator.indent():
            for ns in imported_namespaces:
                generator.emit(ns.name + ',')
        generator.emit(')')
    generator.emit('except (SystemError, ValueError):')
    # Fallback if imported from outside a package.
    with generator.indent():
        for ns in imported_namespaces:
            generator.emit('import {namespace_name}{type_ignore_comment}'.format(
                namespace_name=ns.name,
                type_ignore_comment=type_ignore_comment
            ))
    generator.emit()


# This will be at the top of every generated file.
_validators_import_template = """\
try:
    from . import stone_validators as bv
    from . import stone_base as bb
except (SystemError, ValueError):
    # Catch errors raised when importing a relative module when not in a package.
    # This makes testing this file directly (outside of a package) easier.
    import stone_validators as bv{type_ignore_comment}
    import stone_base as bb{type_ignore_comment}

"""
validators_import = _validators_import_template.format(type_ignore_comment="")
validators_import_with_type_ignore = _validators_import_template.format(
    type_ignore_comment=TYPE_IGNORE_COMMENT
)

def class_name_for_data_type(data_type, ns=None):
    """
    Returns the name of the Python class that maps to a user-defined type.
    The name is identical to the name in the spec.

    If ``ns`` is set to a Namespace and the namespace of `data_type` does
    not match, then a namespace prefix is added to the returned name.
    For example, ``foreign_ns.TypeName``.
    """
    assert is_user_defined_type(data_type) or is_alias(data_type), \
        'Expected composite type, got %r' % type(data_type)
    name = fmt_class(data_type.name)
    if ns and data_type.namespace != ns:
        # If from an imported namespace, add a namespace prefix.
        name = '{}.{}'.format(data_type.namespace.name, name)
    return name
