"""Example generator that outputs a Stone file equivalent to the input file.

Current limitations:
- Whitespace is not reproduced exactly (this may be a feature)
- Order of definitions is lost
- Comments are lost
- Aliases are lost (they are expanded in-line)
- Docstrings are reformatted
"""
from __future__ import absolute_import, division, print_function, unicode_literals

import six

from stone.lang.parser import StoneTypeRef
from stone.data_type import DataType, _BoundedInteger, _BoundedFloat
from stone.data_type import List, String, Timestamp
from stone.data_type import Struct, Union, Void
from stone.generator import CodeGenerator


class UnstoneGenerator(CodeGenerator):
    """Main class.

    The Stone CLI finds this class through introspection."""

    def generate(self, api):
        """Main code generator entry point."""
        # Create a file for each namespace.
        for namespace in api.namespaces.values():
            with self.output_to_relative_path('%s.stone' % namespace.name):
                # Output a namespace header.
                self.emit('namespace %s' % namespace.name)
                # Output all data type (struct and union) definitions.
                for data_type in namespace.linearize_data_types():
                    self.generate_data_type(data_type)
                # Output all route definitions.
                for route in namespace.routes:
                    self.generate_route(route)

    def generate_data_type(self, data_type):
        """Output a data type definition (a struct or union)."""
        if isinstance(data_type, Struct):
            # Output a struct definition.
            self.emit('')
            self.emit('struct %s' % data_type.name)
            with self.indent():
                if data_type.doc is not None:
                    self.emit(self.format_string(data_type.doc))
                for field in data_type.fields:
                    type_repr = self.format_data_type(field.data_type)
                    if not field.has_default:
                        self.emit('%s %s' % (field.name, type_repr))
                    else:
                        self.emit('%s %s = %s' %
                            (field.name, type_repr, self.format_value(field.default)))
                    if field.doc is not None:
                        with self.indent():
                            self.emit(self.format_value(field.doc))
        elif isinstance(data_type, Union):
            # Output a union definition.
            self.emit('')
            self.emit('union %s' % data_type.name)
            with self.indent():
                if data_type.doc is not None:
                    self.emit(self.format_string(data_type.doc))
                for field in data_type.fields:
                    name = field.name
                    # Add a star for a catch-all field.
                    # (There are two ways to recognize these.)
                    if field.catch_all or field is data_type.catch_all_field:
                        name += '*'
                    if isinstance(field.data_type, Void):
                        self.emit('%s' % (name))
                    else:
                        type_repr = self.format_data_type(field.data_type)
                        self.emit('%s %s' % (name, type_repr))
                    if field.doc is not None:
                        with self.indent():
                            self.emit(self.format_value(field.doc))
        else:
            # Don't know what this is.
            self.emit('')
            self.emit('# ??? %s' % repr(data_type))

    def generate_route(self, route):
        """Output a route definition."""
        self.emit('')
        self.emit('route %s (%s, %s, %s)' % (
            route.name,
            self.format_data_type(route.arg_data_type),
            self.format_data_type(route.result_data_type),
            self.format_data_type(route.error_data_type)
        ))
        # Output the docstring.
        with self.indent():
            if route.doc is not None:
                self.emit(self.format_string(route.doc))

    # Table describing data types with parameters.
    _data_type_map = [
        (_BoundedInteger, ['min_value', 'max_value']),
        (_BoundedFloat, ['min_value', 'max_value']),
        (List, ['data_type', 'min_items', 'max_items']),
        (String, ['min_length', 'max_length', 'pattern']),
        (Timestamp, ['format']),
    ]

    def format_data_type(self, data_type):
        """Helper function to format a data type.

        This returns the name if it's a struct or union, otherwise
        (i.e. for primitive types) it renders the name and the
        parameters.
        """
        s = data_type.name
        for type_class, key_list in self._data_type_map:
            if isinstance(data_type, type_class):
                args = []
                for key in key_list:
                    val = getattr(data_type, key)
                    if val is not None:
                        if isinstance(val, StoneTypeRef):
                            sval = val.name
                        elif isinstance(val, DataType):
                            sval = self.format_data_type(val)
                        else:
                            sval = self.format_value(val)
                        args.append(key + '=' + sval)
                if args:
                    s += '(' + ', '.join(args) + ')'
                break
        if data_type.nullable:
            s += '?'
        return s

    def format_value(self, val):
        """Helper function to format a value."""
        if isinstance(val, six.text_type):
            return self.format_string(val)
        else:
            return six.text_type(val)

    def format_string(self, val):
        """Helper function to format a string."""
        return '"' + val.replace('\\', '\\\\').replace('"', '\\"').replace('\n', '\n\n') + '"'
