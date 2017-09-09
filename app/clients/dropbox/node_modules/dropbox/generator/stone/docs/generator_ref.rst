*******************
Writing a Generator
*******************

This document explains how to write your own generator. If you're simply
looking to use an included generator, please see `Using Generated Code
<using_generator.rst>`_.

.. contents:: **Table of Contents**

Generators convert a spec into some other markup or code. Most commonly, a
generator will target a programming language and convert a spec into classes
and functions. But, generators can also create markup for things like API
documentation.

Generators are written as Python modules that satisfy the following
conditions:

1. The filename must have a ``.stoneg.py`` extension. For example,
   ``example.stoneg.py``

2. At least one class must exist in the module that extends the
   ``stone.generator.CodeGenerator`` class and implements the abstract
   ``generate()`` method. Stone automatically detects subclasses and calls
   the ``generate()`` method. All such subclasses will be called in ASCII
   order.

Getting Started
===============

Here's a simple no-op generator::

    from stone.generator import CodeGenerator

    class ExampleGenerator(CodeGenerator):
        def generate(self, api):
            pass

Assuming that the generator is saved in your current directory as
``example.stoneg.py`` and that our running example spec ``users.stone`` from the
`Language Reference <lang_ref.rst>`_ is also in the current directory. you can
invoke the generator with the following command::

    $ stone example.stoneg.py . users.stone

Generating Output Files
=======================

To create an output file, use the ``output_to_relative_path()`` method.
Its only argument is the path relative to the output directory, which was
specified as an argument to ``stone``, where the file should be created.

Here's an example generator that creates an output file for each namespace.
Each file is named after a respective namespace and have a ``.cpp`` extension.
Each file contains a one line C++-style comment::

    from stone.generator import CodeGenerator

    class ExampleGenerator(CodeGenerator):
        def generate(self, api):
            for namespace_name in api.namespaces:
                with self.output_to_relative_path(namespace_name + '.cpp'):
                    self.emit('/* {} */'.format(namespace_name))

Using the API Object
====================

The ``generate`` method receives an ``api`` variable, which represents the API
spec as a Python object. The object is an instance of the ``stone.api.Api``
class. From this object, you can access all the defined namespaces, data types,
and routes.

Api
---

namespaces
    A map from namespace name to Namespace object.

route_schema
    A Struct object that defines the schema for route attributes.

Namespace
---------

name
    The name of the namespace.

doc
    The documentation string for the namespace. This is a concatenation of the
    docstrings for this namespace across all spec files in the order that they
    were specified to `stone` on the command line. The string has no leading
    or trailing whitespace except for a newline at the end.

    If no documentation string exists, this is ``None``.

routes
    A list of Route objects in alphabetical order.

route_by_name
    A map from route name to Route object.

data_types
    A list of user-defined DataType objects in alphabetical order.

data_type_by_name
    A map from data type name to DataType object.

aliases
    A list of Alias objects in alphabetical order. Aliases will only be
    available if the generator has set its ``preserve_aliases`` class variable
    to true.

alias_type_by_name
    A map from alias name to Alias object.

get_imported_namespaces(must_have_imported_data_type=False)
    A list of Namespace objects. A namespace is a member of this list if it is
    imported by the current namespace and a data type or alias is referenced
    from it. If you want only namespaces with aliases referenced, set the
    ``must_have_imported_data_type`` parameter to true. Namespaces are in ASCII
    order by name.

get_namespaces_imported_by_route_io()
    A list of Namespace objects. A namespace is a member of this list if it is
    imported by the current namespace and has a data type from it referenced as
    an argument, result, or error of a route. Namespaces are in ASCII order by
    name.

get_route_io_data_types()
    A list of all user-defined data types that are referenced as either an
    argument, result, or error of a route. If a List or Nullable data type is
    referenced, then the contained data type is returned assuming it's a
    user-defined type.

linearize_data_types()
    Returns a list of all data types used in the namespace. Because the
    inheritance of data types can be modeled as a DAG, the list will be a
    linearization of the DAG. It's ideal to generate data types in this
    order so that user-defined types that reference other user-defined types
    are defined in the correct order.

linearize_aliases()
    Returns a list of all aliases used in the namespace. The aliases are
    ordered to ensure that if they reference other aliases those aliases come
    earlier in the list.

Route
-----

name
    The name of the route.

deprecated
    Set to a ``DeprecationInfo`` object if this route is deprecated. If the
    route was deprecated by a newer route, ``DeprecationInfo`` will have
    a ``by`` attribute populated with the new route.

doc
    The documentation string for the route.

arg_data_type
    A DataType object of the arg to the route.

arg_data_type
    A DataType object of the result of the route.

error_data_type
    A DataType object of the error of the route.

attrs
    A map from string keys to values that is a direct copy of the attrs
    specified in the route definition. Values are limited to Python primitives
    (None, bool, float, int, str) and `TagRef objects <#union-tag-reference>`_.

See the Python object definition for more information.

DataType
--------

name
    The name of the data type.

See ``stone.data_type`` for all primitive type definitions and their
attributes.

Struct
------

name
    The name of the struct.

namespace
    The namespace the struct was defined in.

doc
    The documentation string for the struct.

fields
    A list of StructField objects defined by this struct. Does not include any
    inherited fields.

all_fields
    A list of StructField objects including inherited fields. Required fields
    come before optional fields.

all_required_fields
    A list of StructField objects required fields. Includes inherited fields.

all_optional_fields
    A list of StructField objects for optional fields. Includes inherited
    fields. Optional fields are those that have defaults, or have a data type
    that is nullable.

parent_type
    If it exists, it points to a DataType object (another struct) that this
    struct inherits from.

has_documented_type_or_fields(include_inherited_fields=False)
    Returns whether this type, or any of its fields, are documented.

    Use this when deciding whether to create a block of documentation for
    this type.

has_documented_fields(include_inherited_fields=False)
    Returns whether at least one field is documented.

get_all_subtypes_with_tags()
    Unlike other enumerated-subtypes-related functionality, this method returns
    not just direct subtypes, but all subtypes of this struct. The tag of each
    subtype is the tag of the enumerated subtype from which it descended.

    The return value is a list of tuples representing subtypes. Each tuple has
    two items. First, the type tag to be used for the subtype. Second, a
    ``Struct`` object representing the subtype.

    Use this when you need to generate a lookup table for a root struct that
    maps a generated class representing a subtype to the tag it needs in the
    serialized format.

    Raises an error if the struct doesn't enumerate subtypes.

get_enumerated_subtypes()
    Returns a list of subtype fields. Each field has a ``name`` attribute which
    is the tag for the subtype. Each field also has a ``data_type`` attribute
    that is a ``Struct`` object representing the subtype.

    Raises an error if the struct doesn't enumerate subtypes.

has_enumerated_subtypes()
    Returns whether this struct enumerates its subtypes.

is_catch_all()
    Indicates whether this struct should be used in the event that none of its
    known enumerated subtypes match a received type tag.

    Raises an error if the struct doesn't enumerate subtypes.

is_member_of_enumerated_subtypes_tree()
    Returns true if this struct enumerates subtypes or if its parent does.
    Structs that are members of trees must be able to be serialized without
    their inherited fields.

get_examples()
    Returns an `OrderedDict
    <https://docs.python.org/2/library/collections.html#collections.OrderedDict>`_
    mapping labels to ``Example`` objects.

StructField
-----------

name
    The name of the field.

doc
    The documentation string for the field.

data_type
    The DataType of the field.

has_default
    Whether this field has a default if it is unset.

default
    The default for this field. Errors if no default is defined.

    The Python type of the default depends on the data type of the field. The
    following table shows the mapping:

    ========================== ============ ============
    Primitive                  Python 2.x   Python 3.x
    ========================== ============ ============
    Bytes                      str          bytes
    Boolean                    bool         bool
    Float{32,64}               float        float
    Int{32,64}, UInt{32,64}    long         int
    List                       list         list
    String                     unicode      str
    Timestamp                  str          str
    ========================== ============ ============

    If the data type of a field is a union, its default can be a `TagRef
    object <#union-tag-reference>`_. No defaults are supported for structs.

Union
-----

name
    The name of the union.

namespace
    The namespace the struct was defined in.

doc
    The documentation string for the union.

fields
    A list of UnionField objects defined by this union. Does not include any
    inherited fields.

all_fields
    A list of all UnionField objects that make up the union. Required fields
    come before optional fields.

parent_type
    If it exists, it points to a DataType object (another union) that this
    union inherits from.

catch_all_field
    A UnionField object representing the catch-all field.

has_documented_type_or_fields(include_inherited_fields=False)
    Returns whether this type, or any of its fields, are documented.

    Use this when deciding whether to create a block of documentation for
    this type.

has_documented_fields(include_inherited_fields=False)
    Returns whether at least one field is documented.

get_examples()
    Returns an `OrderedDict
    <https://docs.python.org/2/library/collections.html#collections.OrderedDict>`_
    mapping labels to ``Example`` objects.

UnionField
----------

name
    The name of the field.

doc
    The documentation string for the field.

data_type
    The DataType of the field.

catch_all
    A boolean indicating whether this field is the catch-all for the union.

Alias
-----

name
    The target name.

data_type
    The DataType referenced by the alias as the source.

doc
    The documentation string for the alias.

Example
-------

label
    The label for the example defined in the spec.

text
    A textual description of the example that follows the label in the spec.
    Is ``None`` if no text was provided.

example
    A JSON representation of the example that is generated based on the example
    defined in the spec.

.. _emit_methods:

Emit*() Methods
===============

There are several ``emit*()`` methods included in a ``CodeGenerator`` that each
serve a different purpose.

``emit(s='')``
    Adds indentation, then the input string, and lastly a newline to the output
    buffer. If ``s`` is an empty string (default) then an empty line is created
    with no indentation.

``emit_wrapped_text(s, prefix='', initial_prefix='', subsequent_prefix='', width=80, break_long_words=False, break_on_hyphens=False)``
    Adds the input string to the output buffer with indentation and wrapping.
    The wrapping is performed by the ``textwrap.fill`` Python library
    function.

    ``prefix`` is prepended to every line of the wrapped string.
    ``initial_prefix`` is prepended to the first line of the wrapped string
    ``subsequent_prefix`` is prepended to every line after the first.
    On a line, ``prefix`` will always come before ``initial_prefix`` and
    ``subsequent_prefix``. ``width`` is the target width of each line including
    indentation and prefixes.

    If true, ``break_long_words`` breaks words longer than width.  If false,
    those words will not be broken, and some lines might be longer
    than width. If true, ``break_on_hyphens`` allows breaking hyphenated words;
    wrapping will occur preferably on whitespaces and right after the hyphen
    in compound words.

``emit_raw(s)``
    Adds the input string to the output buffer. The string must end in a
    newline. It may contain any number of newline characters. No indentation is
    generated.

Indentation
===========

The ``stone.generator.CodeGenerator`` class provides a context
manager for adding incremental indentation. Here's an example::

    from stone.generator import CodeGenerator

    class ExampleGenerator(CodeGenerator):
        def generate(self, api):
            with self.output_to_relative_path('ex_indent.out'):
                with self.indent()
                    self.emit('hello')
                    self._output_world()
        def _output_world(self):
            with self.indent():
                self.emit('world')

The contents of ``ex_indent.out`` is::

        hello
            world

Indentation is always four spaces. We plan to make this customizable in the
future.

Helpers for Code Generation
===========================

``generate_multiline_list(items, before='', after='', delim=('(', ')'), compact=True, sep=',', skip_last_sep=False)``
    Given a list of items, emits one item per line. This is convenient for
    function prototypes and invocations, as well as for instantiating arrays,
    sets, and maps in some languages.

    ``items`` is the list of strings that make up the list. ``before`` is the
    string that comes before the list of items. ``after`` is the string that
    follows the list of items. The first element of ``delim`` is added
    immediately following ``before``, and the second element is added
    prior to ``after``.

    If ``compact`` is true, the enclosing parentheses are on the same lines as
    the first and last list item.

    ``sep`` is the string that follows each list item when compact is true. If
    compact is false, the separator is omitted for the last item.
    ``skip_last_sep`` indicates whether the last line should have a trailing
    separator. This parameter only applies when ``compact`` is false.

``block(before='', after='', delim=('{','}'), dent=None, allman=False)``
    A context manager that emits configurable lines before and after an
    indented block of text. This is convenient for class and function
    definitions in some languages.

    ``before`` is the string to be output in the first line which is not
    indented. ``after`` is the string to be output in the last line which is
    also not indented. The first element of ``delim`` is added immediately
    following ``before`` and a space. The second element is added prior to a
    space and then ``after``. ``dent`` is the amount to indent the block. If
    none, the default indentation increment is used. ``allman`` indicates
    whether to use ``Allman`` style indentation instead of the default ``K&R``
    style.  For more about indent styles see `Wikipedia
    <http://en.wikipedia.org/wiki/Indent_style>`_.

``process_doc(doc, handler)``
    Helper for parsing documentation `references <lang_ref.rst#doc-refs>`_ in
    Stone docstrings and replacing them with more suitable annotations for the
    target language.

    ``doc`` is the docstring to scan for references. ``handler`` is a function
     you define with the following signature: `(tag: str, value: str) -> str`.
     ``handler`` will be called for every reference found in the docstring with
     the tag and value parsed for you. The returned string will be substituted
     in the docstring for the reference.

Generator Instance Variables
============================

logger
    This is an instance of the `logging.Logger
    <https://docs.python.org/2/library/logging.html#logger-objects>`_ class
    from the Python standard library. Messages written to the logger will be
    output to standard error as the generator runs.

target_folder_path
    The path to the output folder. Use this when the
    ``output_to_relative_path`` method is insufficient for your purposes.

Data Type Classification Helpers
================================

``stone.data_type`` includes functions for classifying data types. These are
useful when generators need to discriminate between types. The following are
available::

    is_binary_type(data_type)
    is_boolean_type(data_type)
    is_composite_type(data_type)
    is_integer_type(data_type)
    is_float_type(data_type)
    is_list_type(data_type)
    is_nullable_type(data_type)
    is_numeric_type(data_type)
    is_primitive_type(data_type)
    is_string_type(data_type)
    is_struct_type(data_type)
    is_timestamp_type(data_type)
    is_union_type(data_type)
    is_user_defined_type(data_type)
    is_void_type(data_type)

There is also an ``unwrap_nullable(data_type)`` function that takes a
``Nullable`` object and returns the type that it wraps. If the argument is not
a ``Nullable``, then it's returned unmodified. Similarly,
``unwrap_aliases(data_type)`` takes an ``Alias`` object and returns the type
that it wraps. There might be multiple levels of aliases wrapping the type.

The ``unwrap(data_type)`` function will return the underlying type once all
wrapping ``Nullable`` and ``Alias`` objects have been removed. Note that an
``Alias`` can wrap a ``Nullable`` and a ``Nullable`` can wrap an ``Alias``.

Union Tag Reference
===================

Tag references can occur in two instances. First, as the default of a struct
field with a union data type. Second, as the value of a route attribute.
References are limited to members with void type.

TagRef
------

union_data_type
    The Union object that is the data type of the field.

tag_name
    The name of the union member with void type that is the field default.

To check for a default value that is a ``TagRef``, use ``is_tag_ref(val)``
which can be imported from ``stone.data_type``.

Command-Line Arguments
======================

Generators can receive arguments from the command-line. A ``--`` is used to
separate arguments to the ``stone`` program and the generator. For example::

    $ stone generator/python/python.stoneg.py . spec.stone -- -h
    usage: python-generator [-h] [-r ROUTE_METHOD]

    optional arguments:
      -h, --help            show this help message and exit
      -r ROUTE_METHOD, --route-method ROUTE_METHOD
                            A string used to construct the location of a Python
                            method for a given route; use {ns} as a placeholder
                            for namespace name and {route} for the route name.
                            This is used to translate Stone doc references to
                            routes to references in Python docstrings.

The above prints the help string specific to the included Python generator.

Command-line parsing relies on Python's `argparse module
<https://docs.python.org/2.7/library/argparse.html>`_ so familiarity with it
is helpful.

To define a command-line parser for a generator, assign an `Argument Parser
<https://docs.python.org/2.7/library/argparse.html#argumentparser-objects>`_
object to the ``cmdline_parser`` class variable of your generator. Set the
``prog`` keyword to the name of your generator, otherwise, the help string
will claim to be for ``stone``.

The ``generate`` method will have access to an ``args`` instance variable with
an `argparse.Namespace object
<https://docs.python.org/2.7/library/argparse.html#the-namespace-object>`_
holding the parsed command-line arguments.

Here's a minimal example::

    import argparse
    from stone.generator import CodeGenerator

    _cmdline_parser = argparse.ArgumentParser(prog='example')
    _cmdline_parser.add_argument('-v', '--verbose', action='store_true',
                                 help='Prints to stdout.')

    class ExampleGenerator(CodeGenerator):

        cmdline_parser = _cmdline_parser

        def generate(self, api):
            if self.args.verbose:
                print 'Running in verbose mode'

Examples
========

The following examples can all be found in the ``stone/example/generator``
folder.

Example 1: List All Namespaces
------------------------------

We'll create a generator ``ex1.stoneg.py`` that generates a file called
``ex1.out``. Each line in the file will be the name of a defined namespace::

    from stone.generator import CodeGenerator

    class ExampleGenerator(CodeGenerator):
        def generate(self, api):
            """Generates a file that lists each namespace."""
            with self.output_to_relative_path('ex1.out'):
                for namespace in api.namespaces.values():
                    self.emit(namespace.name)

We use ``output_to_relative_path()`` a member of ``CodeGenerator`` to specify
where the output of our ``emit*()`` calls go (See more emit_methods_).

Run the generator from the root of the Stone folder using the example specs
we've provided::

    $ stone example/generator/ex1/ex1.stoneg.py output/ex1 example/api/dbx-core/*.stone

Now examine the contents of the output::

    $ cat example/generator/ex1/ex1.out
    files
    users

Example 2: A Python module for each Namespace
---------------------------------------------

Now we'll create a Python module for each namespace. Each module will define
a ``noop()`` function::

    from stone.generator import CodeGenerator

    class ExamplePythonGenerator(CodeGenerator):
        def generate(self, api):
            """Generates a module for each namespace."""
            for namespace in api.namespaces.values():
                # One module per namespace is created. The module takes the name
                # of the namespace.
                with self.output_to_relative_path('{}.py'.format(namespace.name)):
                    self._generate_namespace_module(namespace)

        def _generate_namespace_module(self, namespace):
            self.emit('def noop():')
            with self.indent():
                self.emit('pass')

Note how we used the ``self.indent()`` context manager to increase the
indentation level by a default 4 spaces. If you want to use tabs instead,
set the ``tabs_for_indents`` class variable of your extended CodeGenerator
class to ``True``.

Run the generator from the root of the Stone folder using the example specs
we've provided::

    $ stone example/generator/ex2/ex2.stoneg.py output/ex2 example/api/dbx-core/*.stone

Now examine the contents of the output::

    $ cat output/ex2/files.py
    def noop():
        pass
    $ cat output/ex2/users.py
    def noop():
        pass

Example 3: Define Python Classes for Structs
--------------------------------------------

As a more advanced example, we'll define a generator that makes a Python class
for each struct in our specification. We'll use some provided helpers from
``stone.target.python``::

    from stone.data_type import is_struct_type
    from stone.generator import CodeGeneratorMonolingual
    from stone.target.python import (
        fmt_class,
        fmt_var,
    )

    class ExamplePythonGenerator(CodeGeneratorMonolingual):

        # PythonTargetLanguage has helper methods for formatting class, obj
        # and variable names (some languages use underscores to separate words,
        # others use camelcase).
        lang = PythonTargetLanguage()

        def generate(self, api):
            """Generates a module for each namespace."""
            for namespace in api.namespaces.values():
                # One module per namespace is created. The module takes the name
                # of the namespace.
                with self.output_to_relative_path('{}.py'.format(namespace.name)):
                    self._generate_namespace_module(namespace)

        def _generate_namespace_module(self, namespace):
            for data_type in namespace.linearize_data_types():
                if not is_struct_type(data_type):
                    # Only handle user-defined structs (avoid unions and primitives)
                    continue

                # Define a class for each struct
                class_def = 'class {}(object):'.format(fmt_class(data_type.name))
                self.emit(class_def)

                with self.indent():
                    if data_type.doc:
                        self.emit('"""')
                        self.emit_wrapped_text(data_type.doc)
                        self.emit('"""')

                    self.emit()

                    # Define constructor to take each field
                    args = ['self']
                    for field in data_type.fields:
                        args.append(fmt_var(field.name))
                    self.generate_multiline_list(args, 'def __init__', ':')

                    with self.indent():
                        if data_type.fields:
                            self.emit()
                            # Body of init should assign all init vars
                            for field in data_type.fields:
                                if field.doc:
                                    self.emit_wrapped_text(field.doc, '# ', '# ')
                                member_name = fmt_var(field.name)
                                self.emit('self.{0} = {0}'.format(member_name))
                        else:
                            self.emit('pass')
                self.emit()
