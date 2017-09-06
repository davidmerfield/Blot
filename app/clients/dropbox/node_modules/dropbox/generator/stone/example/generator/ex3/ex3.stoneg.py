from stone.data_type import is_struct_type
from stone.generator import CodeGenerator
from stone.target.python_helpers import (
    fmt_class,
    fmt_var,
)

class ExamplePythonGenerator(CodeGenerator):

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
