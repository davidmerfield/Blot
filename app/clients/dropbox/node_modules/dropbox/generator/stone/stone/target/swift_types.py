from __future__ import absolute_import, division, print_function, unicode_literals

import json
import os
import shutil

from contextlib import contextmanager

from stone.data_type import (
    is_list_type,
    is_numeric_type,
    is_string_type,
    is_struct_type,
    is_union_type,
    is_void_type,
    unwrap_nullable,
)
from stone.target.swift_helpers import (
    fmt_class,
    fmt_default_value,
    fmt_func,
    fmt_var,
    fmt_type,
)
from stone.target.swift import (
    base,
    fmt_serial_obj,
    SwiftBaseGenerator,
    undocumented,
)

_MYPY = False
if _MYPY:
    import typing  # noqa: F401 # pylint: disable=import-error,unused-import,useless-suppression

# Hack to get around some of Python 2's standard library modules that
# accept ascii-encodable unicode literals in lieu of strs, but where
# actually passing such literals results in errors with mypy --py2. See
# <https://github.com/python/typeshed/issues/756> and
# <https://github.com/python/mypy/issues/2536>.
import importlib
argparse = importlib.import_module(str('argparse'))  # type: typing.Any


_cmdline_parser = argparse.ArgumentParser(prog='swift-types-generator')
_cmdline_parser.add_argument(
    '-r',
    '--route-method',
    help=('A string used to construct the location of a Swift method for a '
          'given route; use {ns} as a placeholder for namespace name and '
          '{route} for the route name.'),
)


class SwiftTypesGenerator(SwiftBaseGenerator):
    """
    Generates Swift modules to represent the input Stone spec.

    Examples for a hypothetical 'copy' enpoint:

    Endpoint argument (struct):

    ```
    open class CopyArg: CustomStringConvertible {
        open let fromPath: String
        open let toPath: String
        public init(fromPath: String, toPath: String) {
            stringValidator(pattern: "/(.|[\\r\\n])*")(value: fromPath)
            self.fromPath = fromPath
            stringValidator(pattern: "/(.|[\\r\\n])*")(value: toPath)
            self.toPath = toPath
        }
        open var description: String {
            return "\\(SerializeUtil.prepareJSONForSerialization(
                CopyArgSerializer().serialize(self)))"
        }
    }
    ```

    Endpoint error (union):

    ```
    open enum CopyError: CustomStringConvertible {
        case TooManyFiles
        case Other

        open var description: String {
            return "\\(SerializeUtil.prepareJSONForSerialization(
                CopyErrorSerializer().serialize(self)))"
        }
    }
    ```

    Argument serializer (error serializer not listed):

    ```
    open class CopyArgSerializer: JSONSerializer {
        public init() { }
        open func serialize(value: CopyArg) -> JSON {
            let output = [
            "from_path": Serialization.serialize(value.fromPath),
            "to_path": Serialization.serialize(value.toPath),
            ]
            return .Dictionary(output)
        }
        open func deserialize(json: JSON) -> CopyArg {
            switch json {
                case .Dictionary(let dict):
                    let fromPath = Serialization.deserialize(dict["from_path"] ?? .Null)
                    let toPath = Serialization.deserialize(dict["to_path"] ?? .Null)
                    return CopyArg(fromPath: fromPath, toPath: toPath)
                default:
                    fatalError("Type error deserializing")
            }
        }
    }
    ```
    """

    cmdline_parser = _cmdline_parser
    def generate(self, api):
        rsrc_folder = os.path.join(os.path.dirname(__file__), 'swift_rsrc')
        self.logger.info('Copying StoneValidators.swift to output folder')
        shutil.copy(os.path.join(rsrc_folder, 'StoneValidators.swift'),
                    self.target_folder_path)
        self.logger.info('Copying StoneSerializers.swift to output folder')
        shutil.copy(os.path.join(rsrc_folder, 'StoneSerializers.swift'),
                    self.target_folder_path)
        self.logger.info('Copying StoneBase.swift to output folder')
        shutil.copy(os.path.join(rsrc_folder, 'StoneBase.swift'),
                    self.target_folder_path)

        jazzy_cfg_path = os.path.join('../Format', 'jazzy.json')
        with open(jazzy_cfg_path) as jazzy_file:
            jazzy_cfg = json.load(jazzy_file)

        for namespace in api.namespaces.values():
            ns_class = fmt_class(namespace.name)
            with self.output_to_relative_path('{}.swift'.format(ns_class)):
                self._generate_base_namespace_module(api, namespace)
            jazzy_cfg['custom_categories'][1]['children'].append(ns_class)

            if namespace.routes:
                jazzy_cfg['custom_categories'][0]['children'].append(ns_class + 'Routes')

        with self.output_to_relative_path('../../../../.jazzy.json'):
            self.emit_raw(json.dumps(jazzy_cfg, indent=2) + '\n')

    def _generate_base_namespace_module(self, api, namespace):
        self.emit_raw(base)

        routes_base = 'Datatypes and serializers for the {} namespace'.format(namespace.name)
        self.emit_wrapped_text(routes_base, prefix='/// ', width=120)

        with self.block('open class {}'.format(fmt_class(namespace.name))):
            for data_type in namespace.linearize_data_types():
                if is_struct_type(data_type):
                    self._generate_struct_class(namespace, data_type)
                    self.emit()
                elif is_union_type(data_type):
                    self._generate_union_type(namespace, data_type)
                    self.emit()
            if namespace.routes:
                self._generate_route_objects(api.route_schema, namespace)

    def _generate_struct_class(self, namespace, data_type):
        if data_type.doc:
            doc = self.process_doc(data_type.doc, self._docf)
        else:
            doc = 'The {} struct'.format(fmt_class(data_type.name))
        self.emit_wrapped_text(doc, prefix='/// ', width=120)
        protocols = []
        if not data_type.parent_type:
            protocols.append('CustomStringConvertible')

        with self.class_block(data_type, protocols=protocols):
            for field in data_type.fields:
                fdoc = self.process_doc(field.doc,
                    self._docf) if field.doc else undocumented
                self.emit_wrapped_text(fdoc, prefix='/// ', width=120)
                self.emit('open let {}: {}'.format(
                    fmt_var(field.name),
                    fmt_type(field.data_type),
                ))
            self._generate_struct_init(namespace, data_type)

            decl = 'open var' if not data_type.parent_type else 'open override var'

            with self.block('{} description: String'.format(decl)):
                cls = fmt_class(data_type.name) + 'Serializer'
                self.emit('return "\\(SerializeUtil.prepareJSONForSerialization' +
                          '({}().serialize(self)))"'.format(cls))

        self._generate_struct_class_serializer(namespace, data_type)

    def _generate_struct_init(self, namespace, data_type):  # pylint: disable=unused-argument
        # init method
        args = self._struct_init_args(data_type)
        if data_type.parent_type and not data_type.fields:
            return
        with self.function_block('public init', self._func_args(args)):
            for field in data_type.fields:
                v = fmt_var(field.name)
                validator = self._determine_validator_type(field.data_type, v)
                if validator:
                    self.emit('{}({})'.format(validator, v))
                self.emit('self.{} = {}'.format(v, v))
            if data_type.parent_type:
                func_args = [(fmt_var(f.name),
                              fmt_var(f.name))
                             for f in data_type.parent_type.all_fields]
                self.emit('super.init({})'.format(self._func_args(func_args)))

    def _determine_validator_type(self, data_type, value):
        data_type, nullable = unwrap_nullable(data_type)
        if is_list_type(data_type):
            item_validator = self._determine_validator_type(data_type.data_type, value)
            if item_validator:
                v = "arrayValidator({})".format(
                    self._func_args([
                        ("minItems", data_type.min_items),
                        ("maxItems", data_type.max_items),
                        ("itemValidator", item_validator),
                    ])
                )
            else:
                return None
        elif is_numeric_type(data_type):
            v = "comparableValidator({})".format(
                self._func_args([
                    ("minValue", data_type.min_value),
                    ("maxValue", data_type.max_value),
                ])
            )
        elif is_string_type(data_type):
            pat = data_type.pattern if data_type.pattern else None
            pat = pat.encode('unicode_escape').replace("\"", "\\\"") if pat else pat
            v = "stringValidator({})".format(
                self._func_args([
                    ("minLength", data_type.min_length),
                    ("maxLength", data_type.max_length),
                    ("pattern", '"{}"'.format(pat) if pat else None),
                ])
            )
        else:
            return None

        if nullable:
            v = "nullableValidator({})".format(v)
        return v

    def _generate_enumerated_subtype_serializer(self, namespace,  # pylint: disable=unused-argument
            data_type):
        with self.block('switch value'):
            for tags, subtype in data_type.get_all_subtypes_with_tags():
                assert len(tags) == 1, tags
                tag = tags[0]
                tagvar = fmt_var(tag)
                self.emit('case let {} as {}:'.format(
                    tagvar,
                    fmt_type(subtype)
                ))

                with self.indent():
                    block_txt = 'for (k, v) in Serialization.getFields({}.serialize({}))'.format(
                        fmt_serial_obj(subtype),
                        tagvar,
                    )
                    with self.block(block_txt):
                        self.emit('output[k] = v')
                    self.emit('output[".tag"] = .str("{}")'.format(tag))
            self.emit('default: fatalError("Tried to serialize unexpected subtype")')

    def _generate_struct_base_class_deserializer(self, namespace, data_type):
        args = []
        for field in data_type.all_fields:
            var = fmt_var(field.name)
            value = 'dict["{}"]'.format(field.name)
            self.emit('let {} = {}.deserialize({} ?? {})'.format(
                var,
                fmt_serial_obj(field.data_type),
                value,
                fmt_default_value(namespace, field) if field.has_default else '.null'
            ))

            args.append((var, var))
        self.emit('return {}({})'.format(
            fmt_class(data_type.name),
            self._func_args(args)
        ))

    def _generate_enumerated_subtype_deserializer(self, namespace, data_type):
        self.emit('let tag = Serialization.getTag(dict)')
        with self.block('switch tag'):
            for tags, subtype in data_type.get_all_subtypes_with_tags():
                assert len(tags) == 1, tags
                tag = tags[0]
                self.emit('case "{}":'.format(tag))
                with self.indent():
                    self.emit('return {}.deserialize(json)'.format(fmt_serial_obj(subtype)))
            self.emit('default:')
            with self.indent():
                if data_type.is_catch_all():
                    self._generate_struct_base_class_deserializer(namespace, data_type)
                else:
                    self.emit('fatalError("Unknown tag \\(tag)")')

    def _generate_struct_class_serializer(self, namespace, data_type):
        with self.serializer_block(data_type):
            with self.serializer_func(data_type):
                if not data_type.all_fields:
                    self.emit('let output = [String: JSON]()')
                else:
                    intro = 'var' if data_type.has_enumerated_subtypes() else 'let'
                    self.emit("{} output = [ ".format(intro))
                    for field in data_type.all_fields:
                        self.emit('"{}": {}.serialize(value.{}),'.format(
                            field.name,
                            fmt_serial_obj(field.data_type),
                            fmt_var(field.name)
                        ))
                    self.emit(']')

                    if data_type.has_enumerated_subtypes():
                        self._generate_enumerated_subtype_serializer(namespace, data_type)
                self.emit('return .dictionary(output)')
            with self.deserializer_func(data_type):
                with self.block("switch json"):
                    dict_name = "let dict" if data_type.all_fields else "_"
                    self.emit("case .dictionary({}):".format(dict_name))
                    with self.indent():
                        if data_type.has_enumerated_subtypes():
                            self._generate_enumerated_subtype_deserializer(namespace, data_type)
                        else:
                            self._generate_struct_base_class_deserializer(namespace, data_type)
                    self.emit("default:")
                    with self.indent():
                        self.emit('fatalError("Type error deserializing")')

    def _format_tag_type(self, namespace, data_type):  # pylint: disable=unused-argument
        if is_void_type(data_type):
            return ''
        else:
            return '({})'.format(fmt_type(data_type))

    def _generate_union_type(self, namespace, data_type):
        if data_type.doc:
            doc = self.process_doc(data_type.doc, self._docf)
        else:
            doc = 'The {} union'.format(fmt_class(data_type.name))
        self.emit_wrapped_text(doc, prefix='/// ', width=120)

        class_type = fmt_class(data_type.name)
        with self.block('public enum {}: CustomStringConvertible'.format(class_type)):
            for field in data_type.all_fields:
                typ = self._format_tag_type(namespace, field.data_type)

                fdoc = self.process_doc(field.doc,
                    self._docf) if field.doc else 'An unspecified error.'
                self.emit_wrapped_text(fdoc, prefix='/// ', width=120)
                self.emit('case {}{}'.format(fmt_var(field.name), typ))
            self.emit()
            with self.block('public var description: String'):
                cls = class_type + 'Serializer'
                self.emit('return "\\(SerializeUtil.prepareJSONForSerialization' +
                          '({}().serialize(self)))"'.format(cls))

        self._generate_union_serializer(data_type)

    def _tag_type(self, data_type, field):
        return "{}.{}".format(
            fmt_class(data_type.name),
            fmt_var(field.name)
        )

    def _generate_union_serializer(self, data_type):
        with self.serializer_block(data_type):
            with self.serializer_func(data_type), self.block('switch value'):
                for field in data_type.all_fields:
                    field_type = field.data_type
                    case = '.{}{}'.format(fmt_var(field.name),
                                         '' if is_void_type(field_type) else '(let arg)')
                    self.emit('case {}:'.format(case))

                    with self.indent():
                        if is_void_type(field_type):
                            self.emit('var d = [String: JSON]()')
                        elif (is_struct_type(field_type) and
                                not field_type.has_enumerated_subtypes()):
                            self.emit('var d = Serialization.getFields({}.serialize(arg))'.format(
                                fmt_serial_obj(field_type)))
                        else:
                            self.emit('var d = ["{}": {}.serialize(arg)]'.format(
                                field.name,
                                fmt_serial_obj(field_type)))
                        self.emit('d[".tag"] = .str("{}")'.format(field.name))
                        self.emit('return .dictionary(d)')
            with self.deserializer_func(data_type):
                with self.block("switch json"):
                    self.emit("case .dictionary(let d):")
                    with self.indent():
                        self.emit('let tag = Serialization.getTag(d)')
                        with self.block('switch tag'):
                            for field in data_type.all_fields:
                                field_type = field.data_type
                                self.emit('case "{}":'.format(field.name))

                                tag_type = self._tag_type(data_type, field)
                                with self.indent():
                                    if is_void_type(field_type):
                                        self.emit('return {}'.format(tag_type))
                                    else:
                                        if (is_struct_type(field_type) and
                                                not field_type.has_enumerated_subtypes()):
                                            subdict = 'json'
                                        else:
                                            subdict = 'd["{}"] ?? .null'.format(field.name)

                                        self.emit('let v = {}.deserialize({})'.format(
                                            fmt_serial_obj(field_type), subdict
                                        ))
                                        self.emit('return {}(v)'.format(tag_type))
                            self.emit('default:')
                            with self.indent():
                                if data_type.catch_all_field:
                                    self.emit('return {}'.format(
                                        self._tag_type(data_type, data_type.catch_all_field)
                                    ))
                                else:
                                    self.emit('fatalError("Unknown tag \\(tag)")')
                    self.emit("default:")
                    with self.indent():

                        self.emit('fatalError("Failed to deserialize")')

    @contextmanager
    def serializer_block(self, data_type):
        with self.class_block(fmt_class(data_type.name) + 'Serializer',
                              protocols=['JSONSerializer']):
            self.emit("public init() { }")
            yield

    @contextmanager
    def serializer_func(self, data_type):
        with self.function_block('open func serialize',
                                 args=self._func_args([('_ value', fmt_class(data_type.name))]),
                                 return_type='JSON'):
            yield

    @contextmanager
    def deserializer_func(self, data_type):
        with self.function_block('open func deserialize',
                                 args=self._func_args([('_ json', 'JSON')]),
                                 return_type=fmt_class(data_type.name)):
            yield

    def _generate_route_objects(self, route_schema, namespace):
        self.emit()
        self.emit('/// Stone Route Objects')
        self.emit()
        for route in namespace.routes:
            var_name = fmt_func(route.name)
            with self.block('static let {} = Route('.format(var_name),
                            delim=(None, None), after=')'):
                self.emit('name: \"{}\",'.format(route.name))
                self.emit('namespace: \"{}\",'.format(namespace.name))
                self.emit('deprecated: {},'.format('true' if route.deprecated
                                                   is not None else 'false'))
                self.emit('argSerializer: {},'.format(fmt_serial_obj(route.arg_data_type)))
                self.emit('responseSerializer: {},'.format(fmt_serial_obj(route.result_data_type)))
                self.emit('errorSerializer: {},'.format(fmt_serial_obj(route.error_data_type)))
                attrs = []
                for field in route_schema.fields:
                    attr_key = field.name
                    attr_val = ("\"{}\"".format(route.attrs.get(attr_key))
                            if route.attrs.get(attr_key) else 'nil')
                    attrs.append('\"{}\": {}'.format(attr_key, attr_val))

                self.generate_multiline_list(
                    attrs, delim=('attrs: [', ']'), compact=True)
