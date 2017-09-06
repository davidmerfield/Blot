from stone.generator import CodeGenerator

class ExamplePythonGenerator(CodeGenerator):
    def generate(self, api):
        """Generates a module for each namespace."""
        for namespace in api.namespaces.values():
            # One module per namespace is created. The module takes the name
            # of the namespace.
            with self.output_to_relative_path('{}.py'.format(namespace.name)):
                self._generate_namespace_module(namespace)

    def _generate_namespace_module(self, namespace):  # pylint: disable=unused-argument
        self.emit('def noop():')
        with self.indent():
            self.emit('pass')
