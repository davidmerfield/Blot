from __future__ import absolute_import, division, print_function, unicode_literals

from collections import OrderedDict
import logging
import six

import ply.yacc as yacc

from .lexer import StoneLexer, StoneNull

class _Element(object):

    def __init__(self, path, lineno, lexpos):
        """
        Args:
            lineno (int): The line number where the start of this element
                occurs.
            lexpos (int): The character offset into the file where this element
                occurs.
        """
        self.path = path
        self.lineno = lineno
        self.lexpos = lexpos

class StoneNamespace(_Element):

    def __init__(self, path, lineno, lexpos, name, doc):
        """
        Args:
            name (str): The namespace of the spec.
            doc (Optional[str]): The docstring for this namespace.
        """
        super(StoneNamespace, self).__init__(path, lineno, lexpos)
        self.name = name
        self.doc = doc

    def __str__(self):
        return self.__repr__()

    def __repr__(self):
        return 'StoneNamespace({!r})'.format(self.name)

class StoneImport(_Element):

    def __init__(self, path, lineno, lexpos, target):
        """
        Args:
            target (str): The name of the namespace to import.
        """
        super(StoneImport, self).__init__(path, lineno, lexpos)
        self.target = target

    def __str__(self):
        return self.__repr__()

    def __repr__(self):
        return 'StoneImport({!r})'.format(self.target)

class StoneAlias(_Element):

    def __init__(self, path, lineno, lexpos, name, type_ref, doc):
        """
        Args:
            name (str): The name of the alias.
            type_ref (StoneTypeRef): The data type of the field.
            doc (Optional[str]): Documentation string for the alias.
        """
        super(StoneAlias, self).__init__(path, lineno, lexpos)
        self.name = name
        self.type_ref = type_ref
        self.doc = doc

    def __repr__(self):
        return 'StoneAlias({!r}, {!r})'.format(self.name, self.type_ref)

class StoneTypeDef(_Element):

    def __init__(self, path, lineno, lexpos, name, extends, doc, fields,
                 examples):
        """
        Args:
            name (str): Name assigned to the type.
            extends (Optional[str]); Name of the type this inherits from.
            doc (Optional[str]): Docstring for the type.
            fields (List[StoneField]): Fields of a type, not including
                inherited ones.
            examples (Optional[OrderedDict[str, StoneExample]]): Map from label
                to example.
        """
        super(StoneTypeDef, self).__init__(path, lineno, lexpos)

        self.name = name
        assert isinstance(extends, (StoneTypeRef, type(None))), type(extends)
        self.extends = extends
        assert isinstance(doc, (six.text_type, type(None)))
        self.doc = doc
        assert isinstance(fields, list)
        self.fields = fields
        assert isinstance(examples, (OrderedDict, type(None))), type(examples)
        self.examples = examples

    def __str__(self):
        return self.__repr__()

    def __repr__(self):
        return 'StoneTypeDef({!r}, {!r}, {!r})'.format(
            self.name,
            self.extends,
            self.fields,
        )

class StoneStructDef(StoneTypeDef):

    def __init__(self, path, lineno, lexpos, name, extends, doc, fields,
                 examples, subtypes=None):
        """
        Args:
            subtypes (Tuple[List[StoneSubtypeField], bool]): Inner list
                enumerates subtypes. The bool indicates whether this struct
                is a catch-all.

        See StoneTypeDef for other constructor args.
        """

        super(StoneStructDef, self).__init__(
            path, lineno, lexpos, name, extends, doc, fields, examples)
        assert isinstance(subtypes, (tuple, type(None))), type(subtypes)
        self.subtypes = subtypes

    def __repr__(self):
        return 'StoneStructDef({!r}, {!r}, {!r})'.format(
            self.name,
            self.extends,
            self.fields,
        )

class StoneUnionDef(StoneTypeDef):

    def __init__(self, path, lineno, lexpos, name, extends, doc, fields,
                 examples, closed=False):
        """
        Args:
            closed (bool): Set if this is a closed union.

        See StoneTypeDef for other constructor args.
        """
        super(StoneUnionDef, self).__init__(
            path, lineno, lexpos, name, extends, doc, fields, examples)
        self.closed = closed

    def __repr__(self):
        return 'StoneUnionDef({!r}, {!r}, {!r}, {!r})'.format(
            self.name,
            self.extends,
            self.fields,
            self.closed,
        )

class StoneTypeRef(_Element):

    def __init__(self, path, lineno, lexpos, name, args, nullable, ns):
        """
        Args:
            name (str): Name of the referenced type.
            args (tuple[list, dict]): Arguments to type.
            nullable (bool): Whether the type is nullable (can be null)
            ns (Optional[str]): Namespace that referred type is a member of.
                If none, then refers to the current namespace.
        """
        super(StoneTypeRef, self).__init__(path, lineno, lexpos)
        self.name = name
        self.args = args
        self.nullable = nullable
        self.ns = ns

    def __repr__(self):
        return 'StoneTypeRef({!r}, {!r}, {!r}, {!r})'.format(
            self.name,
            self.args,
            self.nullable,
            self.ns,
        )

class StoneTagRef(_Element):

    def __init__(self, path, lineno, lexpos, tag):
        """
        Args:
            tag (str): Name of the referenced type.
        """
        super(StoneTagRef, self).__init__(path, lineno, lexpos)
        self.tag = tag

    def __repr__(self):
        return 'StoneTagRef({!r})'.format(
            self.tag,
        )

class StoneField(_Element):
    """
    Represents both a field of a struct and a field of a union.
    TODO(kelkabany): Split this into two different classes.
    """

    def __init__(self, path, lineno, lexpos, name, type_ref, deprecated):
        """
        Args:
            name (str): The name of the field.
            type_ref (StoneTypeRef): The data type of the field.
            deprecated (bool): Whether the field is deprecated.
        """
        super(StoneField, self).__init__(path, lineno, lexpos)
        self.name = name
        self.type_ref = type_ref
        self.doc = None
        self.has_default = False
        self.default = None
        self.deprecated = deprecated

    def set_doc(self, docstring):
        self.doc = docstring

    def set_default(self, default):
        self.has_default = True
        self.default = default

    def __repr__(self):
        return 'StoneField({!r}, {!r})'.format(
            self.name,
            self.type_ref,
        )

class StoneVoidField(_Element):

    def __init__(self, path, lineno, lexpos, name):
        super(StoneVoidField, self).__init__(path, lineno, lexpos)
        self.name = name
        self.doc = None

    def set_doc(self, docstring):
        self.doc = docstring

    def __str__(self):
        return self.__repr__()

    def __repr__(self):
        return 'StoneVoidField({!r})'.format(
            self.name,
        )

class StoneSubtypeField(_Element):

    def __init__(self, path, lineno, lexpos, name, type_ref):
        super(StoneSubtypeField, self).__init__(path, lineno, lexpos)
        self.name = name
        self.type_ref = type_ref

    def __repr__(self):
        return 'StoneSubtypeField({!r}, {!r})'.format(
            self.name,
            self.type_ref,
        )

class StoneRouteDef(_Element):

    def __init__(self, path, lineno, lexpos, name, deprecated,
                 arg_type_ref, result_type_ref, error_type_ref=None):
        super(StoneRouteDef, self).__init__(path, lineno, lexpos)
        self.name = name
        self.deprecated = deprecated
        self.arg_type_ref = arg_type_ref
        self.result_type_ref = result_type_ref
        self.error_type_ref = error_type_ref
        self.doc = None
        self.attrs = {}

    def set_doc(self, docstring):
        self.doc = docstring

    def set_attrs(self, attrs):
        self.attrs = attrs

class StoneAttrField(_Element):

    def __init__(self, path, lineno, lexpos, name, value):
        super(StoneAttrField, self).__init__(path, lineno, lexpos)
        self.name = name
        self.value = value

    def __repr__(self):
        return 'StoneAttrField({!r}, {!r})'.format(
            self.name,
            self.value,
        )

class StoneExample(_Element):

    def __init__(self, path, lineno, lexpos, label, text, fields):
        super(StoneExample, self).__init__(path, lineno, lexpos)
        self.label = label
        self.text = text
        self.fields = fields

    def __repr__(self):
        return 'StoneExample({!r}, {!r}, {!r})'.format(
            self.label,
            self.text,
            self.fields,
        )

class StoneExampleField(_Element):

    def __init__(self, path, lineno, lexpos, name, value):
        super(StoneExampleField, self).__init__(path, lineno, lexpos)
        self.name = name
        self.value = value

    def __repr__(self):
        return 'StoneExampleField({!r}, {!r})'.format(
            self.name,
            self.value,
        )

class StoneExampleRef(_Element):

    def __init__(self, path, lineno, lexpos, label):
        super(StoneExampleRef, self).__init__(path, lineno, lexpos)
        self.label = label

    def __repr__(self):
        return 'StoneExampleRef({!r})'.format(self.label)

class StoneParser(object):
    """
    Due to how ply.yacc works, the docstring of each parser method is a BNF
    rule. Comments that would normally be docstrings for each parser rule
    method are kept before the method definition.
    """

    # Ply parser requiment: Tokens must be re-specified in parser
    tokens = StoneLexer.tokens

    # Ply feature: Starting grammar rule
    start = str('spec')  # PLY wants a 'str' instance; this makes it work in Python 2 and 3

    def __init__(self, debug=False):
        self.debug = debug
        self.yacc = yacc.yacc(module=self, debug=self.debug, write_tables=self.debug)
        self.lexer = StoneLexer()
        self._logger = logging.getLogger('stone.stone.parser')
        # [(token type, token value, line number), ...]
        self.errors = []
        # Path to file being parsed. This is added to each token for its
        # utility in error reporting. But the path is never accessed, so this
        # is optional.
        self.path = None
        self.anony_defs = []

    def parse(self, data, path=None):
        """
        Args:
            data (str): Raw specification text.
            path (Optional[str]): Path to specification on filesystem. Only
                used to tag tokens with the file they originated from.
        """
        self.path = path
        parsed_data = self.yacc.parse(data, lexer=self.lexer, debug=self.debug)
        # It generally makes sense for lexer errors to come first, because
        # those can be the root of parser errors. Also, since we only show one
        # error max right now, it's best to show the lexing one.
        for err_msg, lineno in self.lexer.errors[::-1]:
            self.errors.insert(0, (err_msg, lineno, self.path))
        parsed_data.extend(self.anony_defs)
        self.path = None
        self.anony_defs = []
        return parsed_data

    def test_lexing(self, data):
        self.lexer.test(data)

    def got_errors_parsing(self):
        """Whether the lexer or parser had errors."""
        return self.errors

    def get_errors(self):
        """
        If got_errors_parsing() returns True, call this to get the errors.

        Returns:
            list[tuple[msg: str, lineno: int, path: str]]
        """
        return self.errors[:]

    # --------------------------------------------------------------
    # Spec := Namespace Import* Definition*

    def p_spec_init(self, p):
        """spec : NL
                | empty"""
        p[0] = []

    def p_spec_init_decl(self, p):
        """spec : namespace
                | import
                | definition"""
        p[0] = [p[1]]

    def p_spec_iter(self, p):
        """spec : spec namespace
                | spec import
                | spec definition"""
        p[0] = p[1]
        p[0].append(p[2])

    # This covers the case where we have garbage characters in a file that
    # splits a NL token into two separate tokens.
    def p_spec_ignore_newline(self, p):
        'spec : spec NL'
        p[0] = p[1]

    def p_definition(self, p):
        """definition : alias
                      | struct
                      | union
                      | route"""
        p[0] = p[1]

    def p_namespace(self, p):
        """namespace : KEYWORD ID NL
                     | KEYWORD ID NL INDENT docsection DEDENT"""
        if p[1] == 'namespace':
            doc = None
            if len(p) > 4:
                doc = p[5]
            p[0] = StoneNamespace(
                self.path, p.lineno(1), p.lexpos(1), p[2], doc)
        else:
            raise ValueError('Expected namespace keyword')

    def p_import(self, p):
        'import : IMPORT ID NL'
        p[0] = StoneImport(self.path, p.lineno(1), p.lexpos(1), p[2])

    def p_alias(self, p):
        """alias : KEYWORD ID EQ type_ref NL
                 | KEYWORD ID EQ type_ref NL INDENT docsection DEDENT"""
        if p[1] == 'alias':
            doc = p[7] if len(p) > 6 else None
            p[0] = StoneAlias(
                self.path, p.lineno(1), p.lexpos(1), p[2], p[4], doc)
        else:
            raise ValueError('Expected alias keyword')

    def p_nl(self, p):
        'NL : NEWLINE'
        p[0] = p[1]

    # Sometimes we'll have multiple consecutive newlines that the lexer has
    # trouble combining, so we do it in the parser.
    def p_nl_combine(self, p):
        'NL : NL NEWLINE'
        p[0] = p[1]

    # --------------------------------------------------------------
    # Primitive Types

    def p_primitive(self, p):
        """primitive : BOOLEAN
                     | FLOAT
                     | INTEGER
                     | NULL
                     | STRING"""
        p[0] = p[1]

    # --------------------------------------------------------------
    # References to Types
    #
    # There are several places references to types are made:
    # 1. Alias sources
    #    alias x = TypeRef
    # 2. Field data types
    #    struct S
    #        f TypeRef
    # 3. In arguments to type references
    #    struct S
    #        f TypeRef(key=TypeRef)
    #
    # A type reference can have positional and keyword arguments:
    #     TypeRef(value1, ..., kwarg1=kwvalue1)
    # If it has no arguments, the parentheses can be omitted.
    #
    # If a type reference has a '?' suffix, it is a nullable type.

    def p_pos_arg(self, p):
        """pos_arg : primitive
                   | type_ref"""
        p[0] = p[1]

    def p_pos_args_list_create(self, p):
        """pos_args_list : pos_arg"""
        p[0] = [p[1]]

    def p_pos_args_list_extend(self, p):
        """pos_args_list : pos_args_list COMMA pos_arg"""
        p[0] = p[1]
        p[0].append(p[3])

    def p_kw_arg(self, p):
        """kw_arg : ID EQ primitive
                  | ID EQ type_ref"""
        p[0] = {p[1]: p[3]}

    def p_kw_args(self, p):
        """kw_args : kw_arg"""
        p[0] = p[1]

    def p_kw_args_update(self, p):
        """kw_args : kw_args COMMA kw_arg"""
        p[0] = p[1]
        for key in p[3]:
            if key in p[1]:
                msg = "Keyword argument '%s' defined more than once." % key
                self.errors.append((msg, p.lineno(2), self.path))
        p[0].update(p[3])

    def p_args(self, p):
        """args : LPAR pos_args_list COMMA kw_args RPAR
                | LPAR pos_args_list RPAR
                | LPAR kw_args RPAR
                | LPAR RPAR
                | empty"""
        if len(p) > 3:
            if p[3] == ',':
                p[0] = (p[2], p[4])
            elif isinstance(p[2], dict):
                p[0] = ([], p[2])
            else:
                p[0] = (p[2], {})
        else:
            p[0] = ([], {})

    def p_field_nullable(self, p):
        """nullable : Q
                    | empty"""
        p[0] = p[1] == '?'

    def p_type_ref(self, p):
        'type_ref : ID args nullable'
        p[0] = StoneTypeRef(
            path=self.path,
            lineno=p.lineno(1),
            lexpos=p.lexpos(1),
            name=p[1],
            args=p[2],
            nullable=p[3],
            ns=None,
        )

    # A reference to a type in another namespace.
    def p_foreign_type_ref(self, p):
        'type_ref : ID DOT ID args nullable'
        p[0] = StoneTypeRef(
            path=self.path,
            lineno=p.lineno(1),
            lexpos=p.lexpos(1),
            name=p[3],
            args=p[4],
            nullable=p[5],
            ns=p[1],
        )

    # --------------------------------------------------------------
    # Structs
    #
    # An example struct looks as follows:
    #
    # struct S extends P
    #     "This is a docstring for the struct"
    #
    #     typed_field String
    #         "This is a docstring for the field"
    #
    # An example struct that enumerates subtypes looks as follows:
    #
    # struct P
    #     union
    #         t1 S1
    #         t2 S2
    #     field String
    #
    # struct S1 extends P
    #     ...
    #
    # struct S2 extends P
    #     ...
    #

    def p_enumerated_subtypes(self, p):
        """enumerated_subtypes : uniont NL INDENT subtypes_list DEDENT
                               | empty"""
        if len(p) > 2:
            p[0] = (p[4], p[1][0] == 'union')

    def p_struct(self, p):
        """struct : STRUCT ID inheritance NL \
                     INDENT docsection enumerated_subtypes field_list examples DEDENT"""
        self.make_struct(p)

    def p_anony_struct(self, p):
        """anony_def : STRUCT empty inheritance NL \
                INDENT docsection enumerated_subtypes field_list examples DEDENT"""
        self.make_struct(p)

    def make_struct(self, p):
        p[0] = StoneStructDef(
            path=self.path,
            lineno=p.lineno(1),
            lexpos=p.lexpos(1),
            name=p[2],
            extends=p[3],
            doc=p[6],
            subtypes=p[7],
            fields=p[8],
            examples=p[9])

    def p_inheritance(self, p):
        """inheritance : EXTENDS type_ref
                       | empty"""
        if p[1]:
            if p[2].nullable:
                msg = 'Reference cannot be nullable.'
                self.errors.append((msg, p.lineno(1), self.path))
            else:
                p[0] = p[2]

    def p_enumerated_subtypes_list_create(self, p):
        """subtypes_list : subtype_field
                         | empty"""
        if p[1] is not None:
            p[0] = [p[1]]

    def p_enumerated_subtypes_list_extend(self, p):
        'subtypes_list : subtypes_list subtype_field'
        p[0] = p[1]
        p[0].append(p[2])

    def p_enumerated_subtype_field(self, p):
        'subtype_field : ID type_ref NL'
        p[0] = StoneSubtypeField(
            self.path, p.lineno(1), p.lexpos(1), p[1], p[2])

    # --------------------------------------------------------------
    # Fields
    #
    # Each struct has zero or more fields. A field has a name, type,
    # and docstring. The "deprecated" keyword is currently unused.
    #
    # TODO(kelkabany): Split fields into struct fields and union fields
    # since they differ in capabilities rather significantly now.

    def p_field_list_create(self, p):
        """field_list : field
                      | empty"""
        if p[1] is None:
            p[0] = []
        else:
            p[0] = [p[1]]

    def p_field_list_extend(self, p):
        'field_list : field_list field'
        p[0] = p[1]
        p[0].append(p[2])

    def p_field_deprecation(self, p):
        """deprecation : DEPRECATED
                       | empty"""
        p[0] = (p[1] == 'deprecated')

    def p_default_option(self, p):
        """default_option : EQ primitive
                          | EQ tag_ref
                          | empty"""
        if p[1]:
            if isinstance(p[2], StoneTagRef):
                p[0] = p[2]
            else:
                p[0] = p[2]

    def p_field(self, p):
        """field : ID type_ref default_option deprecation NL \
                    INDENT docsection anony_def_option DEDENT
                 | ID type_ref default_option deprecation NL"""
        has_docstring = len(p) > 6 and p[7] is not None
        has_anony_def = len(p) > 6 and p[8] is not None
        p[0] = StoneField(
            self.path, p.lineno(1), p.lexpos(1), p[1], p[2], p[4])
        if p[3] is not None:
            if p[3] is StoneNull:
                p[0].set_default(None)
            else:
                p[0].set_default(p[3])
        if has_docstring:
            p[0].set_doc(p[7])
        if has_anony_def:
            p[8].name = p[2].name
            self.anony_defs.append(p[8])

    def p_anony_def_option(self, p):
        """anony_def_option : anony_def
                            | empty"""
        p[0] = p[1]

    def p_tag_ref(self, p):
        'tag_ref : ID'
        p[0] = StoneTagRef(self.path, p.lineno(1), p.lexpos(1), p[1])

    # --------------------------------------------------------------
    # Unions
    #
    # An example union looks as follows:
    #
    # union U
    #     "This is a docstring for the union"
    #
    #     void_field*
    #         "Docstring for field with type Void"
    #     typed_field String
    #
    # void_field demonstrates the notation for a catch all variant.

    def p_union(self, p):
        """union : uniont ID inheritance NL \
                        INDENT docsection field_list examples DEDENT"""
        self.make_union(p)

    def p_anony_union(self, p):
        """anony_def : uniont empty inheritance NL \
                        INDENT docsection field_list examples DEDENT"""
        self.make_union(p)

    def make_union(self, p):
        p[0] = StoneUnionDef(
            path=self.path,
            lineno=p[1][1],
            lexpos=p[1][2],
            name=p[2],
            extends=p[3],
            doc=p[6],
            fields=p[7],
            examples=p[8],
            closed=p[1][0] == 'union_closed')

    def p_uniont(self, p):
        """uniont : UNION
                  | UNION_CLOSED"""
        p[0] = (p[1], p.lineno(1), p.lexpos(1))

    def p_field_void(self, p):
        """field : ID NL
                 | ID NL INDENT docstring NL DEDENT"""
        p[0] = StoneVoidField(self.path, p.lineno(1), p.lexpos(1), p[1])
        if len(p) > 4:
            p[0].set_doc(p[4])

    # --------------------------------------------------------------
    # Routes
    #
    # An example route looks as follows:
    #
    # route sample-route/sub-path (arg, result, error)
    #     "This is a docstring for the route"
    #
    #     attrs
    #         key="value"
    #
    # The error type is optional.

    def p_route(self, p):
        """route : ROUTE route_name route_io route_deprecation NL \
                        INDENT docsection attrssection DEDENT
                 | ROUTE route_name route_io route_deprecation NL"""
        p[0] = StoneRouteDef(self.path, p.lineno(1), p.lexpos(1), p[2], p[4], *p[3])
        if len(p) > 6:
            p[0].set_doc(p[7])
            if p[8]:
                keys = set()
                for attr in p[8]:
                    if attr.name in keys:
                        msg = "Attribute '%s' defined more than once." % attr.name
                        self.errors.append((msg, attr.lineno, attr.path))
                    keys.add(attr.name)
                p[0].set_attrs(p[8])

    def p_route_name(self, p):
        'route_name : ID route_path'
        if p[2]:
            p[0] = p[1] + p[2]
        else:
            p[0] = p[1]

    def p_route_path_suffix(self, p):
        """route_path : PATH
                      | empty"""
        p[0] = p[1]

    def p_route_io(self, p):
        """route_io : LPAR type_ref COMMA type_ref RPAR
                    | LPAR type_ref COMMA type_ref COMMA type_ref RPAR"""
        if len(p) > 6:
            p[0] = (p[2], p[4], p[6])
        else:
            p[0] = (p[2], p[4], None)

    def p_route_deprecation(self, p):
        """route_deprecation : DEPRECATED
                             | DEPRECATED BY route_name
                             | empty"""
        if len(p) == 4:
            p[0] = (True, p[3])
        elif p[1]:
            p[0] = (True, None)

    def p_attrs_section(self, p):
        """attrssection : ATTRS NL INDENT attr_fields DEDENT
                        | empty"""
        if p[1]:
            p[0] = p[4]

    def p_attr_fields_create(self, p):
        'attr_fields : attr_field'
        p[0] = [p[1]]

    def p_attr_fields_add(self, p):
        'attr_fields : attr_fields attr_field'
        p[0] = p[1]
        p[0].append(p[2])

    def p_attr_field(self, p):
        """attr_field : ID EQ primitive NL
                      | ID EQ tag_ref NL"""
        if p[3] is StoneNull:
            p[0] = StoneAttrField(
                self.path, p.lineno(1), p.lexpos(1), p[1], None)
        else:
            p[0] = StoneAttrField(
                self.path, p.lineno(1), p.lexpos(1), p[1], p[3])

    # --------------------------------------------------------------
    # Doc sections
    #
    # Doc sections appear after struct, union, and route signatures;
    # also after field declarations.
    #
    # They're represented by text (multi-line supported) enclosed by
    # quotations.
    #
    # struct S
    #     "This is a docstring
    #     for struct S"
    #
    #     number Int64
    #         "This is a docstring for this field"

    def p_docsection(self, p):
        """docsection : docstring NL
                      | empty"""
        if p[1] is not None:
            p[0] = p[1]

    def p_docstring_string(self, p):
        'docstring : STRING'
        # Remove trailing whitespace on every line.
        p[0] = '\n'.join([line.rstrip() for line in p[1].split('\n')])

    # --------------------------------------------------------------
    # Examples
    #
    # Examples appear at the bottom of struct definitions to give
    # illustrative examples of what struct values may look like.
    #
    # struct S
    #     number Int64
    #
    #     example default "This is a label"
    #         number=42

    def p_examples_create(self, p):
        """examples : example
                    | empty"""
        p[0] = OrderedDict()
        if p[1] is not None:
            p[0][p[1].label] = p[1]

    def p_examples_add(self, p):
        'examples : examples example'
        p[0] = p[1]
        if p[2].label in p[0]:
            existing_ex = p[0][p[2].label]
            self.errors.append(
                ("Example with label '%s' already defined on line %d." %
                 (existing_ex.label, existing_ex.lineno),
                 p[2].lineno, p[2].path))
        p[0][p[2].label] = p[2]

    # It's possible for no example fields to be specified.
    def p_example(self, p):
        """example : KEYWORD ID NL INDENT docsection example_fields DEDENT
                   | KEYWORD ID NL"""
        if len(p) > 4:
            seen_fields = set()
            for example_field in p[6]:
                if example_field.name in seen_fields:
                    self.errors.append(
                        ("Example with label '%s' defines field '%s' more "
                        "than once." % (p[2], example_field.name),
                        p.lineno(1), self.path))
                seen_fields.add(example_field.name)
            p[0] = StoneExample(
                self.path, p.lineno(1), p.lexpos(1), p[2], p[5],
                OrderedDict((f.name, f) for f in p[6]))
        else:
            p[0] = StoneExample(
                self.path, p.lineno(1), p.lexpos(1), p[2], None, OrderedDict())

    def p_example_fields_create(self, p):
        'example_fields : example_field'
        p[0] = [p[1]]

    def p_example_fields_add(self, p):
        'example_fields : example_fields example_field'
        p[0] = p[1]
        p[0].append(p[2])

    def p_example_field(self, p):
        """example_field : ID EQ primitive NL
                         | ID EQ ex_list NL
                         | ID EQ ex_map NL"""
        if p[3] is StoneNull:
            p[0] = StoneExampleField(
                self.path, p.lineno(1), p.lexpos(1), p[1], None)
        else:
            p[0] = StoneExampleField(
                self.path, p.lineno(1), p.lexpos(1), p[1], p[3])

    def p_example_field_ref(self, p):
        'example_field : ID EQ ID NL'
        p[0] = StoneExampleField(self.path, p.lineno(1), p.lexpos(1),
            p[1], StoneExampleRef(self.path, p.lineno(3), p.lexpos(3), p[3]))

    # --------------------------------------------------------------
    # Example of list

    def p_ex_list(self, p):
        """ex_list : LBRACKET ex_list_items RBRACKET
                   | LBRACKET empty RBRACKET"""
        if p[2] is None:
            p[0] = []
        else:
            p[0] = p[2]

    def p_ex_list_item_primitive(self, p):
        'ex_list_item : primitive'
        if p[1] is StoneNull:
            p[0] = None
        else:
            p[0] = p[1]

    def p_ex_list_item_id(self, p):
        'ex_list_item : ID'
        p[0] = StoneExampleRef(self.path, p.lineno(1), p.lexpos(1), p[1])

    def p_ex_list_item_list(self, p):
        'ex_list_item : ex_list'
        p[0] = p[1]

    def p_ex_list_items_create(self, p):
        """ex_list_items : ex_list_item"""
        p[0] = [p[1]]

    def p_ex_list_items_extend(self, p):
        """ex_list_items : ex_list_items COMMA ex_list_item"""
        p[0] = p[1]
        p[0].append(p[3])

    # --------------------------------------------------------------
    # Maps
    #

    def p_ex_map(self, p):
        """ex_map : LBRACE ex_map_pairs RBRACE
                  | LBRACE empty RBRACE"""
        p[0] = p[2] or {}

    def p_ex_map_elem_primitive(self, p):
        """ex_map_elem : primitive"""
        p[0] = None if p[1] == StoneNull else p[1]

    def p_ex_map_elem_composit(self, p):
        """ex_map_elem : ex_map
                       | ex_list"""
        p[0] = p[1]

    def p_ex_map_elem_id(self, p):
        """ex_map_elem : ID"""
        p[0] = StoneExampleRef(self.path, p.lineno(1), p.lexpos(1), p[1])

    def p_ex_map_pair(self, p):
        """ex_map_pair : ex_map_elem COLON ex_map_elem"""
        try:
            p[0] = {p[1]: p[3]}
        except TypeError:
            msg = u"%s is an invalid hash key because it cannot be hashed." % repr(p[1])
            self.errors.append((msg, p.lineno(2), self.path))
            p[0] = {}

    def p_ex_map_pairs_create(self, p):
        """ex_map_pairs : ex_map_pair """
        p[0] = p[1]

    def p_ex_map_pairs_extend(self, p):
        """ex_map_pairs : ex_map_pairs COMMA ex_map_pair"""
        p[0] = p[1]
        p[0].update(p[3])

    # --------------------------------------------------------------

    # In ply, this is how you define an empty rule. This is used when we want
    # the parser to treat a rule as optional.
    def p_empty(self, p):
        'empty :'
        pass

    # Called by the parser whenever a token doesn't match any rule.
    def p_error(self, token):
        assert token is not None, "Unknown error, please report this."
        self._logger.debug('Unexpected %s(%r) at line %d',
                           token.type,
                           token.value,
                           token.lineno)
        self.errors.append(
            ("Unexpected %s with value %s." %
             (token.type, repr(token.value).lstrip('u')),
             token.lineno, self.path))
