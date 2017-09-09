from __future__ import absolute_import, division, print_function, unicode_literals

import json

from stone.data_type import (
    is_struct_type,
    is_union_type,
    is_void_type,
)
from stone.target.swift import (
    base,
    fmt_serial_type,
    stone_warning,
    SwiftBaseGenerator,
    undocumented,
)
from stone.target.swift_helpers import (
    fmt_class,
    fmt_func,
    fmt_var,
    fmt_type,
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


_cmdline_parser = argparse.ArgumentParser(
    prog='swift-client-generator',
    description=(
        'Generates a Swift class with an object for each namespace, and in each '
        'namespace object, a method for each route. This class assumes that the '
        'swift_types generator was used with the same output directory.'),
)
_cmdline_parser.add_argument(
    '-m',
    '--module-name',
    required=True,
    type=str,
    help=('The name of the Swift module to generate. Please exclude the .swift '
          'file extension.'),
)
_cmdline_parser.add_argument(
    '-c',
    '--class-name',
    required=True,
    type=str,
    help=('The name of the Swift class that contains an object for each namespace, '
          'and in each namespace object, a method for each route.')
)
_cmdline_parser.add_argument(
    '-t',
    '--transport-client-name',
    required=True,
    type=str,
    help='The name of the Swift class that manages network API calls.',
)
_cmdline_parser.add_argument(
    '-y',
    '--client-args',
    required=True,
    type=str,
    help='The client-side route arguments to append to each route by style type.',
)
_cmdline_parser.add_argument(
    '-z',
    '--style-to-request',
    required=True,
    type=str,
    help='The dict that maps a style type to a Swift request object name.',
)


class SwiftGenerator(SwiftBaseGenerator):
    """
    Generates Swift client base that implements route interfaces.

    Examples:

    ```
    open class ExampleClientBase {
        /// Routes within the namespace1 namespace. See Namespace1 for details.
        open var namespace1: Namespace1!
        /// Routes within the namespace2 namespace. See Namespace2 for details.
        open var namespace2: Namespace2!

        public init(client: ExampleTransportClient) {
            self.namespace1 = Namespace1(client: client)
            self.namespace2 = Namespace2(client: client)
        }
    }
    ```

    Here, `ExampleTransportClient` would contain the implementation of a handwritten,
    project-specific networking client. Additionally, the `Namespace1` object would
    have as its methods all routes in the `Namespace1` namespace. A hypothetical 'copy'
    enpoding might be implemented like:

    ```
    open func copy(fromPath fromPath: String, toPath: String) ->
                     ExampleRequestType<Namespace1.CopySerializer, Namespace1.CopyErrorSerializer> {
        let route = Namespace1.copy
        let serverArgs = Namespace1.CopyArg(fromPath: fromPath, toPath: toPath)
        return client.request(route, serverArgs: serverArgs)
    }
    ```

    Here, ExampleRequestType is a project-specific request type, parameterized by response and
    error serializers.
    """

    cmdline_parser = _cmdline_parser

    def generate(self, api):
        for namespace in api.namespaces.values():
            ns_class = fmt_class(namespace.name)
            if namespace.routes:
                with self.output_to_relative_path('{}Routes.swift'.format(ns_class)):
                    self._generate_routes(namespace)

        with self.output_to_relative_path('{}.swift'.format(self.args.module_name)):
            self._generate_client(api)

    def _generate_client(self, api):
        self.emit_raw(base)
        self.emit('import Alamofire')
        self.emit()

        with self.block('open class {}'.format(self.args.class_name)):
            namespace_fields = []
            for namespace in api.namespaces.values():
                if namespace.routes:
                    namespace_fields.append((namespace.name,
                                            fmt_class(namespace.name)))
            for var, typ in namespace_fields:
                self.emit('/// Routes within the {} namespace. '
                          'See {}Routes for details.'.format(var, typ))
                self.emit('open var {}: {}Routes!'.format(var, typ))
            self.emit()

            with self.function_block('public init', args=self._func_args(
                    [('client', '{}'.format(self.args.transport_client_name))])):
                for var, typ in namespace_fields:
                    self.emit('self.{} = {}Routes(client: client)'.format(var, typ))

    def _generate_routes(self, namespace):
        ns_class = fmt_class(namespace.name)
        self.emit_raw(stone_warning)
        self.emit('/// Routes for the {} namespace'.format(namespace.name))

        with self.block('open class {}Routes'.format(ns_class)):
            self.emit('open let client: {}'.format(self.args.transport_client_name))
            args = [('client', '{}'.format(self.args.transport_client_name))]

            with self.function_block('init', self._func_args(args)):
                self.emit('self.client = client')

            self.emit()

            for route in namespace.routes:
                self._generate_route(namespace, route)

    def _get_route_args(self, namespace, route):
        data_type = route.arg_data_type
        arg_type = fmt_type(data_type)
        if is_struct_type(data_type):
            arg_list = self._struct_init_args(data_type, namespace=namespace)

            doc_list = [(fmt_var(f.name), self.process_doc(f.doc, self._docf)
                if f.doc else undocumented) for f in data_type.fields if f.doc]
        elif is_union_type(data_type):
            arg_list = [(fmt_var(data_type.name), '{}.{}'.format(
                fmt_class(namespace.name), fmt_class(data_type.name)))]
            doc_list = [(fmt_var(data_type.name),
                self.process_doc(data_type.doc, self._docf)
                if data_type.doc else 'The {} union'.format(fmt_class(data_type.name)))]
        else:
            arg_list = [] if is_void_type(data_type) else [('request', arg_type)]
            doc_list = []
        return arg_list, doc_list

    def _emit_route(self, namespace, route, req_obj_name, extra_args=None, extra_docs=None):
        arg_list, doc_list = self._get_route_args(namespace, route)
        extra_args = extra_args or []
        extra_docs = extra_docs or []

        arg_type = fmt_type(route.arg_data_type)
        func_name = fmt_func(route.name)

        if route.doc:
            route_doc = self.process_doc(route.doc, self._docf)
        else:
            route_doc = 'The {} route'.format(func_name)
        self.emit_wrapped_text(route_doc, prefix='/// ', width=120)
        self.emit('///')

        for name, doc in doc_list + extra_docs:
            param_doc = '- parameter {}: {}'.format(name, doc if doc is not None else undocumented)
            self.emit_wrapped_text(param_doc, prefix='/// ', width=120)
        self.emit('///')
        output = (' - returns: Through the response callback, the caller will ' +
            'receive a `{}` object on success or a `{}` object on failure.')
        output = output.format(fmt_type(route.result_data_type),
                               fmt_type(route.error_data_type))
        self.emit_wrapped_text(output, prefix='/// ', width=120)

        func_args = [
            ('route', '{}.{}'.format(fmt_class(namespace.name), func_name)),
        ]
        client_args = []
        return_args = [('route', 'route')]

        for name, value, typ in extra_args:
            arg_list.append((name, typ))
            func_args.append((name, value))
            client_args.append((name, value))

        rtype = fmt_serial_type(route.result_data_type)
        etype = fmt_serial_type(route.error_data_type)

        self._maybe_generate_deprecation_warning(route)

        with self.function_block('@discardableResult open func {}'.format(func_name),
                args=self._func_args(arg_list, force_first=False),
                return_type='{}<{}, {}>'.format(req_obj_name, rtype, etype)):
            self.emit('let route = {}.{}'.format(fmt_class(namespace.name), func_name))
            if is_struct_type(route.arg_data_type):
                args = [(name, name) for name, _ in self._struct_init_args(route.arg_data_type)]
                func_args += [('serverArgs', '{}({})'.format(arg_type, self._func_args(args)))]
                self.emit('let serverArgs = {}({})'.format(arg_type, self._func_args(args)))
            elif is_union_type(route.arg_data_type):
                self.emit('let serverArgs = {}'.format(fmt_var(route.arg_data_type.name)))

            if not is_void_type(route.arg_data_type):
                return_args += [('serverArgs', 'serverArgs')]

            return_args += client_args

            txt = 'return client.request({})'.format(
                self._func_args(return_args, not_init=True)
            )

            self.emit(txt)
        self.emit()

    def _maybe_generate_deprecation_warning(self, route):
        if route.deprecated:
            msg = '{} is deprecated.'.format(route.name)
            if route.deprecated.by:
                msg += ' Use {}.'.format(route.deprecated.by.name)
            self.emit('@available(*, unavailable, message:"{}")'.format(msg))

    def _generate_route(self, namespace, route):
        route_type = route.attrs.get('style')
        client_args = json.loads(self.args.client_args)
        style_to_request = json.loads(self.args.style_to_request)

        if route_type not in client_args.keys():
            self._emit_route(namespace, route, style_to_request[route_type])
        else:
            for args_data in client_args[route_type]:
                req_obj_key, type_data_list = tuple(args_data)
                req_obj_name = style_to_request[req_obj_key]

                extra_args = [tuple(type_data[:-1]) for type_data in type_data_list]
                extra_docs = [(type_data[0], type_data[-1]) for type_data in type_data_list]

                self._emit_route(namespace, route, req_obj_name, extra_args, extra_docs)
