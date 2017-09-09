#!/usr/bin/env python

from __future__ import absolute_import, division, print_function, unicode_literals

import unittest

from stone.api import (
    ApiNamespace,
    ApiRoute,
)
from stone.data_type import (
    List,
    Boolean,
    String,
    Struct,
    StructField,
)
from stone.generator import CodeGenerator

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

class _Tester(CodeGenerator):
    """A no-op generator used to test helper methods."""
    def generate(self, api):
        pass

class _TesterCmdline(CodeGenerator):
    cmdline_parser = argparse.ArgumentParser()
    cmdline_parser.add_argument('-v', '--verbose', action='store_true')
    def generate(self, api):
        pass

class TestGenerator(unittest.TestCase):
    """
    Tests the interface exposed to Generators.
    """

    def test_api_namespace(self):
        ns = ApiNamespace('files')
        a1 = Struct('A1', None, ns)
        a1.set_attributes(None, [StructField('f1', Boolean(), None, None)])
        a2 = Struct('A2', None, ns)
        a2.set_attributes(None, [StructField('f2', Boolean(), None, None)])
        l = List(a1)
        s = String()
        route = ApiRoute('test/route', None)
        route.set_attributes(None, None, l, a2, s, None)
        ns.add_route(route)

        # Test that only user-defined types are returned.
        route_io = ns.get_route_io_data_types()
        self.assertIn(a1, route_io)
        self.assertIn(a2, route_io)
        self.assertNotIn(l, route_io)
        self.assertNotIn(s, route_io)

    def test_code_generator_helpers(self):
        t = _Tester(None, [])
        self.assertEqual(t.filter_out_none_valued_keys({}), {})
        self.assertEqual(t.filter_out_none_valued_keys({'a': None}), {})
        self.assertEqual(t.filter_out_none_valued_keys({'a': None, 'b': 3}), {'b': 3})

    def test_code_generator_basic_emitters(self):
        t = _Tester(None, [])

        # Check basic emit
        t.emit('hello')
        self.assertEqual(t.output_buffer_to_string(), 'hello\n')
        t.clear_output_buffer()

        # Check that newlines are disallowed in emit
        self.assertRaises(AssertionError, lambda: t.emit('hello\n'))

        # Check indent context manager
        t.emit('hello')
        with t.indent():
            t.emit('world')
            with t.indent():
                t.emit('!')
        expected = """\
hello
    world
        !
"""
        self.assertEqual(t.output_buffer_to_string(), expected)
        t.clear_output_buffer()

        # --------------------------------------------------------
        # Check text wrapping emitter

        with t.indent():
            t.emit_wrapped_text('Colorless green ideas sleep furiously',
                                prefix='$', initial_prefix='>',
                                subsequent_prefix='|', width=13)
        expected = """\
    $>Colorless
    $|green
    $|ideas
    $|sleep
    $|furiously
"""
        self.assertEqual(t.output_buffer_to_string(), expected)
        t.clear_output_buffer()

    def test_code_generator_list_gen(self):
        t = _Tester(None, [])

        t.generate_multiline_list(['a=1', 'b=2'])
        expected = """\
(a=1,
 b=2)
"""
        self.assertEqual(t.output_buffer_to_string(), expected)
        t.clear_output_buffer()

        t.generate_multiline_list(['a=1', 'b=2'], 'def __init__', after=':')
        expected = """\
def __init__(a=1,
             b=2):
"""
        self.assertEqual(t.output_buffer_to_string(), expected)
        t.clear_output_buffer()

        t.generate_multiline_list(['a=1', 'b=2'], before='function_to_call', compact=False)
        expected = """\
function_to_call(
    a=1,
    b=2,
)
"""
        self.assertEqual(t.output_buffer_to_string(), expected)
        t.clear_output_buffer()

        t.generate_multiline_list(['a=1', 'b=2'], 'function_to_call',
                                  compact=False, skip_last_sep=True)
        expected = """\
function_to_call(
    a=1,
    b=2
)
"""
        self.assertEqual(t.output_buffer_to_string(), expected)
        t.clear_output_buffer()

        t.generate_multiline_list(['a=1', 'b=2'], 'def func', ':',
                                  compact=False, skip_last_sep=True)
        expected = """\
def func(
    a=1,
    b=2
):
"""
        self.assertEqual(t.output_buffer_to_string(), expected)
        t.clear_output_buffer()

        t.generate_multiline_list(['a=1'], 'function_to_call', compact=False)
        expected = 'function_to_call(a=1)\n'
        self.assertEqual(t.output_buffer_to_string(), expected)
        t.clear_output_buffer()

        t.generate_multiline_list(['a=1'], 'function_to_call', compact=True)
        expected = 'function_to_call(a=1)\n'
        self.assertEqual(t.output_buffer_to_string(), expected)
        t.clear_output_buffer()

        t.generate_multiline_list([], 'function_to_call', compact=False)
        expected = 'function_to_call()\n'
        self.assertEqual(t.output_buffer_to_string(), expected)
        t.clear_output_buffer()

        t.generate_multiline_list([], 'function_to_call', compact=True)
        expected = 'function_to_call()\n'
        self.assertEqual(t.output_buffer_to_string(), expected)
        t.clear_output_buffer()

        # Test delimiter
        t.generate_multiline_list(['String'], 'List', delim=('<', '>'), compact=True)
        expected = 'List<String>\n'
        self.assertEqual(t.output_buffer_to_string(), expected)
        t.clear_output_buffer()

    def test_code_generator_block_gen(self):
        t = _Tester(None, [])

        with t.block('int sq(int x)', ';'):
            t.emit('return x*x;')
        expected = """\
int sq(int x) {
    return x*x;
};
"""
        self.assertEqual(t.output_buffer_to_string(), expected)
        t.clear_output_buffer()

        with t.block('int sq(int x)', allman=True):
            t.emit('return x*x;')
        expected = """\
int sq(int x)
{
    return x*x;
}
"""
        self.assertEqual(t.output_buffer_to_string(), expected)
        t.clear_output_buffer()

        with t.block('int sq(int x)', delim=('<', '>'), dent=8):
            t.emit('return x*x;')
        expected = """\
int sq(int x) <
        return x*x;
>
"""
        self.assertEqual(t.output_buffer_to_string(), expected)
        t.clear_output_buffer()

    def test_generator_cmdline(self):
        t = _TesterCmdline(None, ['-v'])
        self.assertTrue(t.args.verbose)


if __name__ == '__main__':
    unittest.main()
