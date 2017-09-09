from __future__ import absolute_import, division, print_function, unicode_literals

import copy
import inspect
import logging

_MYPY = False
if _MYPY:
    import typing  # noqa: F401 # pylint: disable=import-error,unused-import,useless-suppression

# Hack to get around some of Python 2's standard library modules that
# accept ascii-encodable unicode literals in lieu of strs, but where
# actually passing such literals results in errors with mypy --py2. See
# <https://github.com/python/typeshed/issues/756> and
# <https://github.com/python/mypy/issues/2536>.
import importlib
re = importlib.import_module(str('re'))  # type: typing.Any

from ..api import (
    Api,
    ApiNamespace,
    ApiRoute,
    DeprecationInfo,
)
from ..data_type import (
    Alias,
    Boolean,
    Bytes,
    DataType,
    Float32,
    Float64,
    Int32,
    Int64,
    List,
    Map,
    Nullable,
    ParameterError,
    String,
    Struct,
    StructField,
    TagRef,
    Timestamp,
    UInt32,
    UInt64,
    Union,
    UnionField,
    UserDefined,
    Void,
    unwrap_aliases,
)

from .exception import InvalidSpec
from .parser import (
    StoneAlias,
    StoneImport,
    StoneNamespace,
    StoneParser,
    StoneRouteDef,
    StoneStructDef,
    StoneTagRef,
    StoneTypeDef,
    StoneTypeRef,
    StoneUnionDef,
    StoneVoidField,
)

def quote(s):
    assert s.replace('_', '').replace('.', '').replace('/', '').isalnum(), \
        'Only use quote() with names or IDs in Stone.'
    return "'%s'" % s

# Patterns for references in documentation
doc_ref_re = re.compile(r':(?P<tag>[A-z]+):`(?P<val>.*?)`')
doc_ref_val_re = re.compile(
    r'^(null|true|false|-?\d+(\.\d*)?(e-?\d+)?|"[^\\"]*")$')

class Environment(dict):
    # The default environment won't have a name set since it applies to all
    # namespaces. But, every time it's copied to represent the environment
    # of a specific namespace, a name should be set.
    namespace_name = None  # type: typing.Optional[typing.Text]

class TowerOfStone(object):

    data_types = [
        Bytes,
        Boolean,
        Float32,
        Float64,
        Int32,
        Int64,
        List,
        Map,
        String,
        Timestamp,
        UInt32,
        UInt64,
        Void,
    ]

    default_env = Environment(
        **{data_type.__name__: data_type for data_type in data_types})

    # FIXME: Version should not have a default.
    def __init__(self, specs, version='0.1b1', debug=False):
        """Creates a new tower of stone.

        :type specs: List[Tuple[path: str, text: str]]
        :param specs: `path` is never accessed and is only used to report the
            location of a bad spec to the user. `spec` is the text contents of
            a spec (.stone) file.
        """

        self._specs = specs
        self._debug = debug
        self._logger = logging.getLogger('stone.idl')

        self.api = Api(version=version)

        self.parser = StoneParser(debug=debug)
        # Map of namespace name (str) -> environment (dict)
        self._env_by_namespace = {}
        # Used to check for circular references.
        self._resolution_in_progress = set()  # Set[DataType]

        self._item_by_canonical_name = {}

    def parse(self):
        """Parses the text of each spec and returns an API description. Returns
        None if an error was encountered during parsing."""
        raw_api = []
        for path, text in self._specs:
            self._logger.info('Parsing spec %s', path)
            res = self.parse_spec(text, path)
            if self.parser.got_errors_parsing():
                # TODO(kelkabany): Show more than one error at a time.
                msg, lineno, path = self.parser.get_errors()[0]
                raise InvalidSpec(msg, lineno, path)
            elif res:
                namespace_token = self._extract_namespace_token(res)
                namespace = self.api.ensure_namespace(namespace_token.name)
                base_name = self._get_base_name(namespace.name, namespace.name)
                self._item_by_canonical_name[base_name] = namespace_token
                if namespace_token.doc is not None:
                    namespace.add_doc(namespace_token.doc)
                raw_api.append((namespace, res))
                self._add_data_types_and_routes_to_api(namespace, res)
            else:
                self._logger.info('Empty spec: %s', path)

        self._add_imports_to_env(raw_api)
        self._populate_type_attributes()
        self._populate_field_defaults()
        self._populate_enumerated_subtypes()
        self._populate_route_attributes()
        self._populate_examples()
        self._validate_doc_refs()

        self.api.normalize()

        return self.api

    def parse_spec(self, spec, path=None):
        """Parses a single Stone file."""
        if self._debug:
            self.parser.test_lexing(spec)

        return self.parser.parse(spec, path)

    def _extract_namespace_token(self, desc):
        """
        Checks that the namespace is declared first in the spec, and that only
        one namespace is declared.

        Args:
            desc (List[stone.stone.parser._Element]): All tokens in a spec
                file in the order they were defined.

        Return:
            stone.stone.parser.StoneNamespace: The namespace token.
        """
        if len(desc) == 0 or not isinstance(desc[0], StoneNamespace):
            if self._debug:
                self._logger.info('Description: %r', desc)
            raise InvalidSpec('First declaration in a stone must be '
                              'a namespace. Possibly caused by preceding '
                              'errors.', desc[0].lineno, desc[0].path)
        for item in desc[1:]:
            if isinstance(item, StoneNamespace):
                raise InvalidSpec('Only one namespace declaration per file.',
                                  item[0].lineno, item[0].path)
        return desc.pop(0)

    def _add_data_types_and_routes_to_api(self, namespace, desc):
        """
        From the raw output of the parser, create forward references for each
        user-defined type (struct, union, route, and alias).

        Args:
            namespace (stone.api.Namespace): Namespace for definitions.
            desc (List[stone.stone.parser._Element]): All tokens in a spec
                file in the order they were defined. Should not include a
                namespace declaration.
        """

        env = self._get_or_create_env(namespace.name)

        for item in desc:
            if isinstance(item, StoneTypeDef):
                api_type = self._create_type(env, item)
                namespace.add_data_type(api_type)
                self._check_canonical_name_available(item, namespace.name)
            elif isinstance(item, StoneRouteDef):
                route = self._create_route(env, item)
                namespace.add_route(route)
                self._check_canonical_name_available(item, namespace.name)
            elif isinstance(item, StoneImport):
                # Handle imports later.
                pass
            elif isinstance(item, StoneAlias):
                alias = self._create_alias(env, item)
                namespace.add_alias(alias)
                self._check_canonical_name_available(item, namespace.name)
            else:
                raise AssertionError('Unknown Stone Declaration Type %r' %
                                     item.__class__.__name__)

    def _check_canonical_name_available(self, item, namespace_name):
        base_name = self._get_base_name(item.name, namespace_name)

        if base_name not in self._item_by_canonical_name.keys():
            self._item_by_canonical_name[base_name] = item
        else:
            stored_item = self._item_by_canonical_name[base_name]
            msg = ("Name of %s '%s' conflicts with name of "
                   "%s '%s' (%s:%s).") % (
                self._get_user_friendly_item_type_as_string(item),
                item.name,
                self._get_user_friendly_item_type_as_string(stored_item),
                stored_item.name,
                stored_item.path, stored_item.lineno)

            raise InvalidSpec(msg, item.lineno, item.path)

    @classmethod
    def _get_user_friendly_item_type_as_string(cls, item):
        if isinstance(item, StoneTypeDef):
            return 'user-defined type'
        elif isinstance(item, StoneRouteDef):
            return 'route'
        elif isinstance(item, StoneAlias):
            return 'alias'
        elif isinstance(item, StoneNamespace):
            return 'namespace'
        else:
            raise AssertionError('unhandled type %r' % item)

    def _get_base_name(self, input_str, namespace_name):
        return (input_str.replace('_', '').replace('/', '').lower() +
                namespace_name.replace('_', '').lower())

    def _add_imports_to_env(self, raw_api):
        """
        Scans raw parser output for import declarations. Checks if the imports
        are valid, and then creates a reference to the namespace in the
        environment.

        Args:
            raw_api (Tuple[Namespace, List[stone.stone.parser._Element]]):
                Namespace paired with raw parser output.
        """
        for namespace, desc in raw_api:
            for item in desc:
                if isinstance(item, StoneImport):
                    if namespace.name == item.target:
                        raise InvalidSpec('Cannot import current namespace.',
                                          item.lineno, item.path)
                    if item.target not in self.api.namespaces:
                        raise InvalidSpec(
                            'Namespace %s is not defined in any spec.' %
                            quote(item.target),
                            item.lineno, item.path)
                    env = self._get_or_create_env(namespace.name)
                    imported_env = self._get_or_create_env(item.target)
                    if namespace.name in imported_env:
                        # Block circular imports. The Python generator can't
                        # easily generate code for circular references.
                        raise InvalidSpec(
                            'Circular import of namespaces %s and %s '
                            'detected.' %
                            (quote(namespace.name), quote(item.target)),
                            item.lineno, item.path)
                    env[item.target] = imported_env

    def _create_alias(self, env, item):
        # NOTE: I don't like supporting forward references for aliases
        # because it makes specs harder to read. But we have to so that if a
        # namespace is split across multiple files, the order they're specified
        # in the command line which affects alias ordering is irrelevant.
        if item.name in env:
            existing_dt = env[item.name]
            raise InvalidSpec(
                'Symbol %s already defined (%s:%d).' %
                (quote(item.name), existing_dt._token.path,
                existing_dt._token.lineno), item.lineno, item.path)

        namespace = self.api.ensure_namespace(env.namespace_name)
        alias = Alias(item.name, namespace, item)
        env[item.name] = alias
        return alias

    def _create_type(self, env, item):
        """Create a forward reference for a union or struct."""
        if item.name in env:
            existing_dt = env[item.name]
            raise InvalidSpec(
                'Symbol %s already defined (%s:%d).' %
                (quote(item.name), existing_dt._token.path,
                 existing_dt._token.lineno), item.lineno, item.path)
        namespace = self.api.ensure_namespace(env.namespace_name)
        if isinstance(item, StoneStructDef):
            try:
                api_type = Struct(name=item.name, namespace=namespace, token=item)
            except ParameterError as e:
                raise InvalidSpec(
                    'Bad declaration of %s: %s' % (quote(item.name), e.args[0]),
                    item.lineno, item.path)
        elif isinstance(item, StoneUnionDef):
            api_type = Union(
                name=item.name, namespace=namespace, token=item, closed=item.closed)
        else:
            raise AssertionError('Unknown type definition %r' % type(item))

        env[item.name] = api_type
        return api_type

    def _populate_type_attributes(self):
        """
        Converts each struct, union, and route from a forward reference to a
        full definition.
        """
        for namespace in self.api.namespaces.values():
            env = self._get_or_create_env(namespace.name)

            for alias in namespace.aliases:
                data_type = self._resolve_type(env, alias._token.type_ref)
                alias.set_attributes(alias._token.doc, data_type)

            for data_type in namespace.data_types:
                if not data_type._is_forward_ref:
                    continue

                self._resolution_in_progress.add(data_type)
                if isinstance(data_type, Struct):
                    self._populate_struct_type_attributes(env, data_type)
                elif isinstance(data_type, Union):
                    self._populate_union_type_attributes(env, data_type)
                else:
                    raise AssertionError('Unhandled type: %r' %
                                         type(data_type))
                self._resolution_in_progress.remove(data_type)

        assert len(self._resolution_in_progress) == 0

    def _populate_struct_type_attributes(self, env, data_type):
        """
        Converts a forward reference of a struct into a complete definition.
        """
        parent_type = None
        extends = data_type._token.extends
        if extends:
            # A parent type must be fully defined and not just a forward
            # reference.
            parent_type = self._resolve_type(env, extends, True)
            if isinstance(parent_type, Alias):
                # Restrict extending aliases because it's difficult to generate
                # code for it in Python. We put all type references at the end
                # to avoid out-of-order declaration issues, but using "extends"
                # in Python forces the reference to happen earlier.
                raise InvalidSpec(
                    'A struct cannot extend an alias. '
                    'Use the canonical name instead.',
                    data_type._token.lineno, data_type._token.path)
            if isinstance(parent_type, Nullable):
                raise InvalidSpec(
                    'A struct cannot extend a nullable type.',
                    data_type._token.lineno, data_type._token.path)
            if not isinstance(parent_type, Struct):
                raise InvalidSpec(
                    'A struct can only extend another struct: '
                    '%s is not a struct.' % quote(parent_type.name),
                    data_type._token.lineno, data_type._token.path)
        api_type_fields = []
        for stone_field in data_type._token.fields:
            api_type_field = self._create_struct_field(env, stone_field)
            api_type_fields.append(api_type_field)
        data_type.set_attributes(
            data_type._token.doc, api_type_fields, parent_type)

    def _populate_union_type_attributes(self, env, data_type):
        """
        Converts a forward reference of a union into a complete definition.
        """
        parent_type = None
        extends = data_type._token.extends
        if extends:
            # A parent type must be fully defined and not just a forward
            # reference.
            parent_type = self._resolve_type(env, extends, True)
            if isinstance(parent_type, Alias):
                raise InvalidSpec(
                    'A union cannot extend an alias. '
                    'Use the canonical name instead.',
                    data_type._token.lineno, data_type._token.path)
            if isinstance(parent_type, Nullable):
                raise InvalidSpec(
                    'A union cannot extend a nullable type.',
                    data_type._token.lineno, data_type._token.path)
            if not isinstance(parent_type, Union):
                raise InvalidSpec(
                    'A union can only extend another union: '
                    '%s is not a union.' % quote(parent_type.name),
                    data_type._token.lineno, data_type._token.path)

        api_type_fields = []
        for stone_field in data_type._token.fields:
            if stone_field.name == 'other':
                raise InvalidSpec(
                    "Union cannot define an 'other' field because it is "
                    "reserved as the catch-all field for open unions.",
                    stone_field.lineno, stone_field.path)
            api_type_fields.append(self._create_union_field(env, stone_field))

        catch_all_field = None
        if data_type.closed:
            if parent_type and not parent_type.closed:
                # Due to the reversed super type / child type relationship for
                # unions, a child type cannot be closed if its parent is open
                # because the parent now has an extra field that is not
                # recognized by the child if it were substituted in for it.
                raise InvalidSpec(
                    "Union cannot be closed since parent type '%s' is open." % (
                        parent_type.name),
                    data_type._token.lineno, data_type._token.path)
        else:
            if not parent_type or parent_type.closed:
                # Create a catch-all field
                catch_all_field = UnionField(
                    name='other', data_type=Void(), doc=None,
                    token=data_type._token, catch_all=True)
                api_type_fields.append(catch_all_field)

        data_type.set_attributes(
            data_type._token.doc, api_type_fields, parent_type, catch_all_field)

    def _populate_field_defaults(self):
        """
        Populate the defaults of each field. This is done in a separate pass
        because defaults that specify a union tag require the union to have
        been defined.
        """
        for namespace in self.api.namespaces.values():
            for data_type in namespace.data_types:
                # Only struct fields can have default
                if not isinstance(data_type, Struct):
                    continue

                for field in data_type.fields:
                    if not field._token.has_default:
                        continue

                    if isinstance(field._token.default, StoneTagRef):
                        default_value = TagRef(field.data_type, field._token.default.tag)
                    else:
                        default_value = field._token.default
                    if not (field._token.type_ref.nullable and default_value is None):
                        # Verify that the type of the default value is correct for this field
                        try:
                            field.data_type.check(default_value)
                        except ValueError as e:
                            raise InvalidSpec(
                                'Field %s has an invalid default: %s' %
                                (quote(field._token.name), e),
                                field._token.lineno, field._token.path)
                    field.set_default(default_value)

    def _populate_route_attributes(self):
        """
        Converts all routes from forward references to complete definitions.
        """
        route_schema = self._validate_stone_cfg()
        self.api.add_route_schema(route_schema)
        for namespace in self.api.namespaces.values():
            env = self._get_or_create_env(namespace.name)
            for route in namespace.routes:
                self._populate_route_attributes_helper(env, route, route_schema)

    def _populate_route_attributes_helper(self, env, route, schema):
        """
        Converts a single forward reference of a route into a complete definition.
        """
        arg_dt = self._resolve_type(env, route._token.arg_type_ref)
        result_dt = self._resolve_type(env, route._token.result_type_ref)
        error_dt = self._resolve_type(env, route._token.error_type_ref)

        if route._token.deprecated:
            assert route._token.deprecated[0]
            new_route_name = route._token.deprecated[1]
            if new_route_name:
                if new_route_name not in env:
                    raise InvalidSpec(
                        'Undefined route %s.' % quote(new_route_name),
                        route._token.lineno, route._token.path)
                new_route = env[new_route_name]
                if not isinstance(new_route, ApiRoute):
                    raise InvalidSpec(
                        '%s must be a route.' % quote(new_route_name),
                        route._token.lineno, route._token.path)
                deprecated = DeprecationInfo(new_route)
            else:
                deprecated = DeprecationInfo()
        else:
            deprecated = None

        attr_by_name = {}
        for attr in route._token.attrs:
            attr_by_name[attr.name] = attr

        try:
            validated_attrs = schema.check_attr_repr(attr_by_name)
        except KeyError as e:
            raise InvalidSpec(
                "Route does not define attr key '%s'." % e.args[0],
                route._token.lineno, route._token.path)

        route.set_attributes(
            deprecated=deprecated,
            doc=route._token.doc,
            arg_data_type=arg_dt,
            result_data_type=result_dt,
            error_data_type=error_dt,
            attrs=validated_attrs)

    def _create_struct_field(self, env, stone_field):
        """
        This function resolves symbols to objects that we've instantiated in
        the current environment. For example, a field with data type named
        "String" is pointed to a String() object.

        The caller needs to ensure that this stone_field is for a Struct and not
        for a Union.

        Returns:
            stone.data_type.StructField: A field of a struct.
        """
        if isinstance(stone_field, StoneVoidField):
            raise InvalidSpec(
                'Struct field %s cannot have a Void type.' %
                quote(stone_field.name),
                stone_field.lineno, stone_field.path)

        data_type = self._resolve_type(env, stone_field.type_ref)
        if isinstance(data_type, Void):
            raise InvalidSpec(
                'Struct field %s cannot have a Void type.' %
                quote(stone_field.name),
                stone_field.lineno, stone_field.path)
        elif isinstance(data_type, Nullable) and stone_field.has_default:
            raise InvalidSpec('Field %s cannot be a nullable '
                              'type and have a default specified.' %
                              quote(stone_field.name),
                              stone_field.lineno, stone_field.path)
        api_type_field = StructField(
            name=stone_field.name,
            data_type=data_type,
            doc=stone_field.doc,
            token=stone_field,
            deprecated=stone_field.deprecated,
        )
        return api_type_field

    def _create_union_field(self, env, stone_field):
        """
        This function resolves symbols to objects that we've instantiated in
        the current environment. For example, a field with data type named
        "String" is pointed to a String() object.

        The caller needs to ensure that this stone_field is for a Union and not
        for a Struct.

        Returns:
            stone.data_type.UnionField: A field of a union.
        """
        if isinstance(stone_field, StoneVoidField):
            api_type_field = UnionField(
                name=stone_field.name, data_type=Void(), doc=stone_field.doc,
                token=stone_field)
        else:
            data_type = self._resolve_type(env, stone_field.type_ref)
            if isinstance(data_type, Void):
                raise InvalidSpec('Union member %s cannot have Void '
                                  'type explicit, omit Void instead.' %
                                  quote(stone_field.name),
                                  stone_field.lineno, stone_field.path)
            api_type_field = UnionField(
                name=stone_field.name, data_type=data_type,
                doc=stone_field.doc, token=stone_field)
        return api_type_field

    def _instantiate_data_type(self, data_type_class, data_type_args, loc):
        """
        Responsible for instantiating a data type with additional attributes.
        This method ensures that the specified attributes are valid.

        Args:
            data_type_class (DataType): The class to instantiate.
            data_type_attrs (dict): A map from str -> values of attributes.
                These will be passed into the constructor of data_type_class
                as keyword arguments.

        Returns:
            stone.data_type.DataType: A parameterized instance.
        """
        assert issubclass(data_type_class, DataType), \
            'Expected stone.data_type.DataType, got %r' % data_type_class

        argspec = inspect.getargspec(data_type_class.__init__)  # noqa: E501 # pylint: disable=deprecated-method,useless-suppression
        argspec.args.remove('self')
        num_args = len(argspec.args)
        # Unfortunately, argspec.defaults is None if there are no defaults
        num_defaults = len(argspec.defaults or ())

        pos_args, kw_args = data_type_args

        if (num_args - num_defaults) > len(pos_args):
            # Report if a positional argument is missing
            raise InvalidSpec(
                'Missing positional argument %s for %s type' %
                (quote(argspec.args[len(pos_args)]),
                 quote(data_type_class.__name__)),
                *loc)
        elif (num_args - num_defaults) < len(pos_args):
            # Report if there are too many positional arguments
            raise InvalidSpec(
                'Too many positional arguments for %s type' %
                quote(data_type_class.__name__),
                *loc)

        # Map from arg name to bool indicating whether the arg has a default
        args = {}
        for i, key in enumerate(argspec.args):
            args[key] = (i >= num_args - num_defaults)

        for key in kw_args:
            # Report any unknown keyword arguments
            if key not in args:
                raise InvalidSpec('Unknown argument %s to %s type.' %
                    (quote(key), quote(data_type_class.__name__)),
                    *loc)
            # Report any positional args that are defined as keywords args.
            if not args[key]:
                raise InvalidSpec(
                    'Positional argument %s cannot be specified as a '
                    'keyword argument.' % quote(key),
                    *loc)
            del args[key]

        try:
            return data_type_class(*pos_args, **kw_args)
        except ParameterError as e:
            # Each data type validates its own attributes, and will raise a
            # ParameterError if the type or value is bad.
            raise InvalidSpec('Bad argument to %s type: %s' %
                (quote(data_type_class.__name__), e.args[0]),
                *loc)

    def _resolve_type(self, env, type_ref, enforce_fully_defined=False):
        """
        Resolves the data type referenced by type_ref.

        If `enforce_fully_defined` is True, then the referenced type must be
        fully populated (fields, parent_type, ...), and not simply a forward
        reference.
        """
        loc = type_ref.lineno, type_ref.path
        orig_namespace_name = env.namespace_name
        if type_ref.ns:
            # TODO(kelkabany): If a spec file imports a namespace, it is
            # available to all spec files that are part of the same namespace.
            # Might want to introduce the concept of an environment specific
            # to a file.
            if type_ref.ns not in env:
                raise InvalidSpec(
                    'Namespace %s is not imported' % quote(type_ref.ns), *loc)
            env = env[type_ref.ns]
            if not isinstance(env, Environment):
                raise InvalidSpec(
                    '%s is not a namespace.' % quote(type_ref.ns), *loc)
        if type_ref.name not in env:
            raise InvalidSpec(
                'Symbol %s is undefined.' % quote(type_ref.name), *loc)

        obj = env[type_ref.name]
        if obj is Void and type_ref.nullable:
            raise InvalidSpec('Void cannot be marked nullable.',
                              *loc)
        elif inspect.isclass(obj):
            resolved_data_type_args = self._resolve_args(env, type_ref.args)
            data_type = self._instantiate_data_type(
                obj, resolved_data_type_args, (type_ref.lineno, type_ref.path))
        elif isinstance(obj, ApiRoute):
            raise InvalidSpec('A route cannot be referenced here.',
                              *loc)
        elif type_ref.args[0] or type_ref.args[1]:
            # An instance of a type cannot have any additional
            # attributes specified.
            raise InvalidSpec('Attributes cannot be specified for '
                              'instantiated type %s.' %
                              quote(type_ref.name),
                              *loc)
        else:
            data_type = env[type_ref.name]

        if type_ref.ns:
            # Add the source namespace as an import.
            namespace = self.api.ensure_namespace(orig_namespace_name)
            if isinstance(data_type, UserDefined):
                namespace.add_imported_namespace(
                    self.api.ensure_namespace(type_ref.ns),
                    imported_data_type=True)
            elif isinstance(data_type, Alias):
                namespace.add_imported_namespace(
                    self.api.ensure_namespace(type_ref.ns),
                    imported_alias=True)

        if (enforce_fully_defined and isinstance(data_type, UserDefined) and
                data_type._is_forward_ref):
            if data_type in self._resolution_in_progress:
                raise InvalidSpec(
                    'Unresolvable circular reference for type %s.' %
                    quote(type_ref.name), *loc)
            self._resolution_in_progress.add(data_type)
            if isinstance(data_type, Struct):
                self._populate_struct_type_attributes(env, data_type)
            elif isinstance(data_type, Union):
                self._populate_union_type_attributes(env, data_type)
            self._resolution_in_progress.remove(data_type)

        if type_ref.nullable:
            unwrapped_dt, _ = unwrap_aliases(data_type)
            if isinstance(unwrapped_dt, Nullable):
                raise InvalidSpec(
                    'Cannot mark reference to nullable type as nullable.',
                    *loc)
            data_type = Nullable(data_type)

        return data_type

    def _resolve_args(self, env, args):
        """
        Resolves type references in data type arguments to data types in
        the environment.
        """
        pos_args, kw_args = args

        def check_value(v):
            if isinstance(v, StoneTypeRef):
                return self._resolve_type(env, v)
            else:
                return v

        new_pos_args = [check_value(pos_arg) for pos_arg in pos_args]
        new_kw_args = {k: check_value(v) for k, v in kw_args.items()}
        return new_pos_args, new_kw_args

    def _create_route(self, env, item):
        """
        Constructs a route and adds it to the environment.

        Args:
            env (dict): The environment of defined symbols. A new key is added
                corresponding to the name of this new route.
            item (StoneRouteDef): Raw route definition from the parser.

        Returns:
            stone.api.ApiRoute: A fully-defined route.
        """
        if item.name in env:
            existing_dt = env[item.name]
            raise InvalidSpec(
                'Symbol %s already defined (%s:%d).' %
                (quote(item.name), existing_dt._token.path,
                 existing_dt._token.lineno), item.lineno, item.path)
        route = ApiRoute(
            name=item.name,
            token=item,
        )
        env[route.name] = route
        return route

    def _get_or_create_env(self, namespace_name):
        # Because there might have already been a spec that was part of this
        # same namespace, the environment might already exist.
        if namespace_name in self._env_by_namespace:
            env = self._env_by_namespace[namespace_name]
        else:
            env = copy.copy(self.default_env)
            env.namespace_name = namespace_name
            self._env_by_namespace[namespace_name] = env
        return env

    def _populate_enumerated_subtypes(self):
        # Since enumerated subtypes require forward references, resolve them
        # now that all types are populated in the environment.
        for namespace in self.api.namespaces.values():
            env = self._get_or_create_env(namespace.name)
            for data_type in namespace.data_types:
                if not (isinstance(data_type, Struct) and
                        data_type._token.subtypes):
                    continue

                subtype_fields = []
                for subtype_field in data_type._token.subtypes[0]:
                    subtype_name = subtype_field.type_ref.name
                    lineno = subtype_field.type_ref.lineno
                    path = subtype_field.type_ref.path
                    if subtype_field.type_ref.name not in env:
                        raise InvalidSpec(
                            'Undefined type %s.' % quote(subtype_name),
                            lineno, path)
                    subtype = self._resolve_type(
                        env, subtype_field.type_ref, True)
                    if not isinstance(subtype, Struct):
                        raise InvalidSpec(
                            'Enumerated subtype %s must be a struct.' %
                            quote(subtype_name), lineno, path)
                    f = UnionField(
                        subtype_field.name, subtype, None, subtype_field)
                    subtype_fields.append(f)
                data_type.set_enumerated_subtypes(subtype_fields,
                                                  data_type._token.subtypes[1])

            # In an enumerated subtypes tree, regular structs may only exist at
            # the leaves. In other words, no regular struct may inherit from a
            # regular struct.
            for data_type in namespace.data_types:
                if (not isinstance(data_type, Struct) or
                        not data_type.has_enumerated_subtypes()):
                    continue

                for subtype_field in data_type.get_enumerated_subtypes():
                    if (not subtype_field.data_type.has_enumerated_subtypes() and
                            len(subtype_field.data_type.subtypes) > 0):
                        raise InvalidSpec(
                            "Subtype '%s' cannot be extended." %
                            subtype_field.data_type.name,
                            subtype_field.data_type._token.lineno,
                            subtype_field.data_type._token.path)

    def _populate_examples(self):
        """Construct every possible example for every type.

        This is done in two passes. The first pass assigns examples to their
        associated types, but does not resolve references between examples for
        different types. This is because the referenced examples may not yet
        exist. The second pass resolves references.
        """
        for namespace in self.api.namespaces.values():
            for data_type in namespace.data_types:
                for example in data_type._token.examples.values():
                    data_type._add_example(example)

        for namespace in self.api.namespaces.values():
            for data_type in namespace.data_types:
                data_type._compute_examples()

    def _validate_doc_refs(self):
        """
        Validates that all the documentation references across every docstring
        in every spec are formatted properly, have valid values, and make
        references to valid symbols.
        """
        for namespace in self.api.namespaces.values():
            env = self._get_or_create_env(namespace.name)
            # Validate the doc refs of each api entity that has a doc
            for data_type in namespace.data_types:
                if data_type.doc:
                    self._validate_doc_refs_helper(
                        env,
                        data_type.doc,
                        (data_type._token.lineno + 1, data_type._token.path),
                        data_type)
                for field in data_type.fields:
                    if field.doc:
                        self._validate_doc_refs_helper(
                            env,
                            field.doc,
                            (field._token.lineno + 1, field._token.path),
                            data_type)
            for route in namespace.routes:
                if route.doc:
                    self._validate_doc_refs_helper(
                        env,
                        route.doc,
                        (route._token.lineno + 1, route._token.path))

    def _validate_doc_refs_helper(self, env, doc, loc, type_context=None):
        """
        Validates that all the documentation references in a docstring are
        formatted properly, have valid values, and make references to valid
        symbols.

        Args:
            env (dict): The environment of defined symbols.
            doc (str): The docstring to validate.
            lineno (int): The line number the docstring begins on in the spec.
            type_context (stone.data_type.UserDefined): If the docstring
                belongs to a user-defined type (Struct or Union) or one of its
                fields, set this to the type. This is needed for "field" doc
                refs that don't name a type to be validated.
        """
        for match in doc_ref_re.finditer(doc):
            tag = match.group('tag')
            val = match.group('val')
            if tag == 'field':
                if '.' in val:
                    type_name, field_name = val.split('.', 1)
                    if type_name not in env:
                        raise InvalidSpec(
                            'Bad doc reference to field %s of '
                            'unknown type %s.' % (field_name, quote(type_name)),
                            *loc)
                    elif isinstance(env[type_name], ApiRoute):
                        raise InvalidSpec(
                            'Bad doc reference to field %s of route %s.' %
                            (quote(field_name), quote(type_name)),
                            *loc)
                    elif not any(field.name == field_name
                                 for field in env[type_name].all_fields):
                        raise InvalidSpec(
                            'Bad doc reference to unknown field %s.' % quote(val),
                            *loc)
                else:
                    # Referring to a field that's a member of this type
                    assert type_context is not None
                    if not any(field.name == val
                               for field in type_context.all_fields):
                        raise InvalidSpec(
                            'Bad doc reference to unknown field %s.' %
                            quote(val),
                            *loc)
            elif tag == 'link':
                if not (1 < val.rfind(' ') < len(val) - 1):
                    # There must be a space somewhere in the middle of the
                    # string to separate the title from the uri.
                    raise InvalidSpec(
                        'Bad doc reference to link (need a title and '
                        'uri separated by a space): %s.' % quote(val),
                        *loc)
            elif tag == 'route':
                if '.' in val:
                    # Handle reference to route in imported namespace.
                    namespace_name, val = val.split('.', 1)
                    if namespace_name not in env:
                        raise InvalidSpec(
                            "Unknown doc reference to namespace '%s'." %
                            namespace_name, *loc)
                    env_to_check = env[namespace_name]
                else:
                    env_to_check = env
                if val not in env_to_check:
                    raise InvalidSpec(
                        'Unknown doc reference to route %s.' % quote(val),
                        *loc)
                elif not isinstance(env_to_check[val], ApiRoute):
                    raise InvalidSpec(
                        'Doc reference to type %s is not a route.' %
                        quote(val), *loc)
            elif tag == 'type':
                if '.' in val:
                    # Handle reference to type in imported namespace.
                    namespace_name, val = val.split('.', 1)
                    if namespace_name not in env:
                        raise InvalidSpec(
                            "Unknown doc reference to namespace '%s'." %
                            namespace_name, *loc)
                    env_to_check = env[namespace_name]
                else:
                    env_to_check = env
                if val not in env_to_check:
                    raise InvalidSpec(
                        "Unknown doc reference to type '%s'." % val,
                        *loc)
                elif not isinstance(env_to_check[val], (Struct, Union)):
                    raise InvalidSpec(
                        'Doc reference to type %s is not a struct or union.' %
                        quote(val), *loc)
            elif tag == 'val':
                if not doc_ref_val_re.match(val):
                    raise InvalidSpec(
                        'Bad doc reference value %s.' % quote(val),
                        *loc)
            else:
                raise InvalidSpec(
                    'Unknown doc reference tag %s.' % quote(tag),
                    *loc)

    def _validate_stone_cfg(self):
        """
        Returns:
             Struct: A schema for route attributes.
        """
        def mk_route_schema():
            s = Struct('Route', ApiNamespace('stone_cfg'), None)
            s.set_attributes(None, [], None)
            return s

        try:
            stone_cfg = self.api.namespaces.pop('stone_cfg')
        except KeyError:
            return mk_route_schema()

        if stone_cfg.routes:
            route = stone_cfg.routes[0]
            raise InvalidSpec(
                'No routes can be defined in the stone_cfg namespace.',
                route._token.lineno,
                route._token.path,
            )

        if not stone_cfg.data_types:
            return mk_route_schema()

        for data_type in stone_cfg.data_types:
            if data_type.name != 'Route':
                raise InvalidSpec(
                    "Only a struct named 'Route' can be defined in the "
                    "stone_cfg namespace.",
                    data_type._token.lineno,
                    data_type._token.path,
                )

        # TODO: are we always guaranteed at least one data type?
        # pylint: disable=undefined-loop-variable
        return data_type
