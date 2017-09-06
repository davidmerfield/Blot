#!/usr/bin/env python

from __future__ import absolute_import, division, print_function, unicode_literals

# pylint: disable=deprecated-method,useless-suppression

import datetime
import textwrap
import unittest

from stone.lang.parser import (
    StoneNamespace,
    StoneAlias,
    StoneParser,
    StoneVoidField,
    StoneTagRef,
)
from stone.lang.tower import (
    InvalidSpec,
    TowerOfStone,
)
from stone.data_type import (
    Alias,
    Nullable,
    String,
    Map
)


class TestStone(unittest.TestCase):
    """
    Tests the Stone format.
    """

    def setUp(self):
        self.parser = StoneParser(debug=False)

    def test_namespace_decl(self):
        text = textwrap.dedent("""\
            namespace files
            """)
        out = self.parser.parse(text)
        self.assertIsInstance(out[0], StoneNamespace)
        self.assertEqual(out[0].name, 'files')

        # test starting with newlines
        text = textwrap.dedent("""\


            namespace files
            """)
        out = self.parser.parse(text)
        self.assertIsInstance(out[0], StoneNamespace)
        self.assertEqual(out[0].name, 'files')

    def test_comments(self):
        text = textwrap.dedent("""\
            # comment at top
            namespace files

            # another full line comment
            alias Rev = String # partial line comment

            struct S # comment before INDENT
                "Doc"
                # inner comment
                f1 UInt64 # partial line comment
                # trailing comment

            struct S2 # struct def following comment
                # start with comment
                f1 String # end with partial-line comment

            # footer comment
            """)
        out = self.parser.parse(text)
        self.assertIsInstance(out[0], StoneNamespace)
        self.assertIsInstance(out[1], StoneAlias)
        self.assertEqual(out[2].name, 'S')
        self.assertEqual(out[3].name, 'S2')

    def test_type_args(self):
        text = textwrap.dedent("""\
            namespace test

            alias T = String(min_length=3)
            alias F = Float64(max_value=3.2e1)
            alias Numbers = List(UInt64)
            """)
        out = self.parser.parse(text)
        self.assertIsInstance(out[1], StoneAlias)
        self.assertEqual(out[1].name, 'T')
        self.assertEqual(out[1].type_ref.name, 'String')
        self.assertEqual(out[1].type_ref.args[1]['min_length'], 3)

        self.assertIsInstance(out[2], StoneAlias)
        self.assertEqual(out[2].name, 'F')
        self.assertEqual(out[2].type_ref.name, 'Float64')
        self.assertEqual(out[2].type_ref.args[1]['max_value'], 3.2e1)

        self.assertIsInstance(out[3], StoneAlias)
        self.assertEqual(out[3].name, 'Numbers')
        self.assertEqual(out[3].type_ref.name, 'List')
        self.assertEqual(out[3].type_ref.args[0][0].name, 'UInt64')

    def test_struct_decl(self):

        # test struct decl with no docs
        text = textwrap.dedent("""\
            namespace files

            struct QuotaInfo
                quota UInt64
            """)
        out = self.parser.parse(text)
        self.assertEqual(out[1].name, 'QuotaInfo')
        self.assertEqual(out[1].fields[0].name, 'quota')
        self.assertEqual(out[1].fields[0].type_ref.name, 'UInt64')

        # test struct with only a top-level doc
        text = textwrap.dedent("""\
            namespace files

            struct QuotaInfo
                "The space quota info for a user."
                quota UInt64
            """)
        out = self.parser.parse(text)
        self.assertEqual(out[1].name, 'QuotaInfo')
        self.assertEqual(out[1].doc, 'The space quota info for a user.')
        self.assertEqual(out[1].fields[0].name, 'quota')
        self.assertEqual(out[1].fields[0].type_ref.name, 'UInt64')

        # test struct with field doc
        text = textwrap.dedent("""\
            namespace files

            struct QuotaInfo
                "The space quota info for a user."
                quota UInt64
                    "The user's total quota allocation (bytes)."
            """)
        out = self.parser.parse(text)
        self.assertEqual(out[1].name, 'QuotaInfo')
        self.assertEqual(out[1].doc, 'The space quota info for a user.')
        self.assertEqual(out[1].fields[0].name, 'quota')
        self.assertEqual(out[1].fields[0].type_ref.name, 'UInt64')
        self.assertEqual(out[1].fields[0].doc, "The user's total quota allocation (bytes).")

        # test without newline after field doc
        text = textwrap.dedent("""\
            namespace files

            struct QuotaInfo
                "The space quota info for a user."
                quota UInt64
                    "The user's total quota allocation (bytes)."
            """)
        out = self.parser.parse(text)
        self.assertEqual(out[1].name, 'QuotaInfo')
        self.assertEqual(out[1].doc, 'The space quota info for a user.')
        self.assertEqual(out[1].fields[0].name, 'quota')
        self.assertEqual(out[1].fields[0].type_ref.name, 'UInt64')
        self.assertEqual(out[1].fields[0].doc, "The user's total quota allocation (bytes).")

        # test with example
        text = textwrap.dedent("""\
            namespace files

            struct QuotaInfo
                "The space quota info for a user."
                quota UInt64
                    "The user's total quota allocation (bytes)."
                example default
                    quota=64000
            """)
        out = self.parser.parse(text)
        self.assertEqual(out[1].name, 'QuotaInfo')
        self.assertIn('default', out[1].examples)

        # test with multiple examples
        text = textwrap.dedent("""\
            namespace files

            struct QuotaInfo
                "The space quota info for a user."
                quota UInt64
                    "The user's total quota allocation (bytes)."
                example default
                    quota=2000000000
                example pro
                    quota=100000000000
            """)
        out = self.parser.parse(text)
        self.assertEqual(out[1].name, 'QuotaInfo')
        self.assertIn('default', out[1].examples)
        self.assertIn('pro', out[1].examples)

        # test with inheritance
        text = textwrap.dedent("""\
            namespace test

            struct S1
                f1 UInt64

            struct S2 extends S1
                f2 String
            """)
        out = self.parser.parse(text)
        self.assertEqual(out[1].name, 'S1')
        self.assertEqual(out[2].name, 'S2')
        self.assertEqual(out[2].extends.name, 'S1')

        # test with defaults
        text = textwrap.dedent("""\
            namespace ns
            struct S
                n1 Int32 = -5
                n2 Int32 = 5
                f1 Float64 = -1.
                f2 Float64 = -4.2
                f3 Float64 = -5e-3
                f4 Float64 = -5.1e-3
            """)
        out = self.parser.parse(text)
        self.assertEqual(out[1].name, 'S')
        self.assertEqual(out[1].fields[0].name, 'n1')
        self.assertTrue(out[1].fields[0].has_default)
        self.assertEqual(out[1].fields[0].default, -5)
        self.assertEqual(out[1].fields[1].default, 5)
        self.assertEqual(out[1].fields[2].default, -1)
        self.assertEqual(out[1].fields[3].default, -4.2)
        self.assertEqual(out[1].fields[4].default, -5e-3)
        self.assertEqual(out[1].fields[5].default, -5.1e-3)

        # Try extending nullable type
        text = textwrap.dedent("""\
            namespace test

            struct S
                f1 String

            struct S2 extends S?
                f2 String
            """)
        t = TowerOfStone([('test.stone', text)])
        with self.assertRaises(InvalidSpec) as cm:
            t.parse()
        self.assertEqual("Reference cannot be nullable.", cm.exception.msg)
        self.assertEqual(cm.exception.lineno, 6)

    def test_union_decl(self):
        # test union with only symbols
        text = textwrap.dedent("""\
            namespace files

            union Role
                "The role a user may have in a shared folder."

                owner
                    "Owner of a file."
                viewer
                    "Read only permission."
                editor
                    "Read and write permission."
            """)
        out = self.parser.parse(text)
        self.assertEqual(out[1].name, 'Role')
        self.assertEqual(out[1].doc, 'The role a user may have in a shared folder.')
        self.assertIsInstance(out[1].fields[0], StoneVoidField)
        self.assertEqual(out[1].fields[0].name, 'owner')
        self.assertIsInstance(out[1].fields[1], StoneVoidField)
        self.assertEqual(out[1].fields[1].name, 'viewer')
        self.assertIsInstance(out[1].fields[2], StoneVoidField)
        self.assertEqual(out[1].fields[2].name, 'editor')

        # TODO: Test a union that includes a struct.

        text = textwrap.dedent("""\
            namespace files

            union Error
                A
                    "Variant A"
                B
                    "Variant B"
            """)
        self.parser.parse(text)

        # test with inheritance
        text = textwrap.dedent("""\
            namespace test

            union U1
                t1 UInt64

            union U2 extends U1
                t2 String
            """)
        out = self.parser.parse(text)
        self.assertEqual(out[1].name, 'U1')
        self.assertEqual(out[2].name, 'U2')
        self.assertEqual(out[2].extends.name, 'U1')

    def test_composition(self):
        text = textwrap.dedent("""\
            namespace files

            union UploadMode
                add
                overwrite

            struct Upload
                path String
                mode UploadMode = add
            """)
        out = self.parser.parse(text)
        self.assertEqual(out[2].name, 'Upload')
        self.assertIsInstance(out[2].fields[1].default, StoneTagRef)
        self.assertEqual(out[2].fields[1].default.tag, 'add')

    def test_route_decl(self):

        text = textwrap.dedent("""\
            namespace users

            route GetAccountInfo(Void, Void, Void)
            """)
        # Test route definition with no docstring
        self.parser.parse(text)

        text = textwrap.dedent("""\
            namespace users

            struct AccountInfo
                email String

            route GetAccountInfo(AccountInfo, Void, Void)
                "Gets the account info for a user"
            """)
        out = self.parser.parse(text)
        self.assertEqual(out[1].name, 'AccountInfo')
        self.assertEqual(out[2].name, 'GetAccountInfo')
        self.assertEqual(out[2].arg_type_ref.name, 'AccountInfo')
        self.assertEqual(out[2].result_type_ref.name, 'Void')
        self.assertEqual(out[2].error_type_ref.name, 'Void')

        # Test raw documentation
        text = textwrap.dedent("""\
            namespace users

            route GetAccountInfo(Void, Void, Void)
                "0

                1

                2

                3
                "
            """)
        out = self.parser.parse(text)
        self.assertEqual(out[1].doc, '0\n\n1\n\n2\n\n3\n')

        # Test deprecation
        text = textwrap.dedent("""\
            namespace test

            route old_route (Void, Void, Void) deprecated
            """)
        t = TowerOfStone([('test.stone', text)])
        t.parse()
        r = t.api.namespaces['test'].route_by_name['old_route']
        self.assertIsNotNone(r.deprecated)
        self.assertIsNone(r.deprecated.by)

        # Test deprecation with target route
        text = textwrap.dedent("""\
            namespace test

            route old_route (Void, Void, Void) deprecated by new_route
            route new_route (Void, Void, Void)
            """)
        t = TowerOfStone([('test.stone', text)])
        t.parse()
        r_old = t.api.namespaces['test'].route_by_name['old_route']
        r_new = t.api.namespaces['test'].route_by_name['new_route']
        self.assertIsNotNone(r.deprecated)
        self.assertEqual(r_old.deprecated.by, r_new)

        # Test deprecation with target route (more complex route names)
        text = textwrap.dedent("""\
            namespace test

            route test/old_route (Void, Void, Void) deprecated by test/new_route
            route test/new_route (Void, Void, Void)
            """)
        t = TowerOfStone([('test.stone', text)])
        t.parse()
        r_old = t.api.namespaces['test'].route_by_name['test/old_route']
        r_new = t.api.namespaces['test'].route_by_name['test/new_route']
        self.assertIsNotNone(r.deprecated)
        self.assertEqual(r_old.deprecated.by, r_new)

        # Try deprecation by undefined route
        text = textwrap.dedent("""\
            namespace test

            route old_route (Void, Void, Void) deprecated by unk_route
            """)
        t = TowerOfStone([('test.stone', text)])
        with self.assertRaises(InvalidSpec) as cm:
            t.parse()
        self.assertEqual("Undefined route 'unk_route'.", cm.exception.msg)
        self.assertEqual(cm.exception.lineno, 3)

        # Try deprecation by struct
        text = textwrap.dedent("""\
            namespace test

            route old_route (Void, Void, Void) deprecated by S

            struct S
                f String
            """)
        t = TowerOfStone([('test.stone', text)])
        with self.assertRaises(InvalidSpec) as cm:
            t.parse()
        self.assertEqual("'S' must be a route.", cm.exception.msg)
        self.assertEqual(cm.exception.lineno, 3)

    def test_alphabetizing(self):
        text1 = textwrap.dedent("""\
            namespace ns_b

            struct z
                f UInt64

            union x
                a
                b

            struct y
                f UInt64

            route b(Void, Void, Void)

            route a(Void, Void, Void)

            route c(Void, Void, Void)
            """)
        text2 = textwrap.dedent("""\
            namespace ns_a

            route d (Void, Void, Void)
            """)
        t = TowerOfStone([('test1.stone', text1), ('test2.stone', text2)])
        t.parse()
        assert ['ns_a', 'ns_b'] == list(t.api.namespaces.keys())
        ns_b = t.api.namespaces['ns_b']
        assert [dt.name for dt in ns_b.data_types] == ['x', 'y', 'z']
        assert [dt.name for dt in ns_b.routes] == ['a', 'b', 'c']

    def test_lexing_errors(self):
        text = textwrap.dedent("""\

            namespace users

            %

            # testing line numbers

            %

            struct AccountInfo
                email String
            """)
        out = self.parser.parse(text)
        msg, lineno = self.parser.lexer.errors[0]
        self.assertEqual(msg, "Illegal character '%'.")
        self.assertEqual(lineno, 4)
        msg, lineno = self.parser.lexer.errors[1]
        self.assertEqual(msg, "Illegal character '%'.")
        self.assertEqual(lineno, 8)
        # Check that despite lexing errors, parser marched on successfully.
        self.assertEqual(out[1].name, 'AccountInfo')

        text = textwrap.dedent("""\
            namespace test

            struct S
                # Indent below is only 3 spaces
               f String
            """)
        t = TowerOfStone([('test.stone', text)])
        with self.assertRaises(InvalidSpec) as cm:
            t.parse()
        self.assertIn("Indent is not divisible by 4.", cm.exception.msg)

    def test_parsing_errors(self):
        text = textwrap.dedent("""\

            namespace users

            strct AccountInfo
                email String
            """)
        self.parser.parse(text)
        msg, lineno, _ = self.parser.errors[0]
        self.assertEqual(msg, "Unexpected ID with value 'strct'.")
        self.assertEqual(lineno, 4)

        text = textwrap.dedent("""\
            namespace users

            route test_route(Blah, Blah, Blah)
            """)
        t = TowerOfStone([('test.stone', text)])
        with self.assertRaises(InvalidSpec) as cm:
            t.parse()
        self.assertIn("Symbol 'Blah' is undefined", cm.exception.msg)

    def test_name_clash(self):
        # namespace / type clash
        text = textwrap.dedent("""\
            namespace test_namespace_test

            struct TestNamespaceTest
                str String
            """)
        t = TowerOfStone([('test.stone', text)])
        with self.assertRaises(InvalidSpec) as cm:
            t.parse()
        self.assertIn("Name of user-defined type 'TestNamespaceTest' conflicts "
            "with name of namespace 'test_namespace_test'", cm.exception.msg)

        # namespace / route clash
        text = textwrap.dedent("""\
            namespace test_namespace_test

            route test_namespace_test(Void, Void, Void)
            """)
        t = TowerOfStone([('test.stone', text)])
        with self.assertRaises(InvalidSpec) as cm:
            t.parse()
        self.assertIn("Name of route 'test_namespace_test' conflicts "
            "with name of namespace 'test_namespace_test'", cm.exception.msg)

        # namespace / alias clash
        text = textwrap.dedent("""\
            namespace test_namespace_test

            alias TestNamespaceTest = String
            """)
        t = TowerOfStone([('test.stone', text)])
        with self.assertRaises(InvalidSpec) as cm:
            t.parse()
        self.assertIn("Name of alias 'TestNamespaceTest' conflicts "
            "with name of namespace 'test_namespace_test'", cm.exception.msg)

        # route / type clash
        text = textwrap.dedent("""\
            namespace test_namespace

            struct TestStructTest
                str String

            route test_struct_test(Void, Void, Void)
            """)
        t = TowerOfStone([('test.stone', text)])
        with self.assertRaises(InvalidSpec) as cm:
            t.parse()
        self.assertIn("Name of route 'test_struct_test' conflicts "
            "with name of user-defined type 'TestStructTest'", cm.exception.msg)

        # alias / route clash
        text = textwrap.dedent("""\
            namespace test_namespace

            alias TestAliasTest = String

            route test_alias_test(Void, Void, Void)
            """)
        t = TowerOfStone([('test.stone', text)])
        with self.assertRaises(InvalidSpec) as cm:
            t.parse()
        self.assertIn("Name of route 'test_alias_test' conflicts "
            "with name of alias 'TestAliasTest'", cm.exception.msg)

    def test_docstrings(self):
        text = textwrap.dedent("""\
            namespace test

            # No docstrings at all
            struct E
                f String

            struct S
                "Only type doc"
                f String

            struct T
                f String
                    "Only field doc"

            union U
                "Only type doc"
                f String

            union V
                f String
                    "Only field doc"

            # Check for inherited doc
            struct W extends T
                g String
            """)
        t = TowerOfStone([('test.stone', text)])
        t.parse()

        E_dt = t.api.namespaces['test'].data_type_by_name['E']
        self.assertFalse(E_dt.has_documented_type_or_fields())
        self.assertFalse(E_dt.has_documented_fields())

        S_dt = t.api.namespaces['test'].data_type_by_name['S']
        self.assertTrue(S_dt.has_documented_type_or_fields())
        self.assertFalse(S_dt.has_documented_fields())

        T_dt = t.api.namespaces['test'].data_type_by_name['T']
        self.assertTrue(T_dt.has_documented_type_or_fields())
        self.assertTrue(T_dt.has_documented_fields())

        U_dt = t.api.namespaces['test'].data_type_by_name['U']
        self.assertTrue(U_dt.has_documented_type_or_fields())
        self.assertFalse(U_dt.has_documented_fields())

        V_dt = t.api.namespaces['test'].data_type_by_name['V']
        self.assertTrue(V_dt.has_documented_type_or_fields())
        self.assertTrue(V_dt.has_documented_fields())

        W_dt = t.api.namespaces['test'].data_type_by_name['W']
        self.assertFalse(W_dt.has_documented_type_or_fields())
        self.assertFalse(W_dt.has_documented_fields())
        self.assertFalse(W_dt.has_documented_type_or_fields(), True)
        self.assertFalse(W_dt.has_documented_fields(), True)

    def test_alias(self):
        # Test aliasing to primitive
        text = textwrap.dedent("""\
            namespace test

            alias R = String
                "This is a test
                of docstrings"
            """)
        t = TowerOfStone([('test.stone', text)])
        t.parse()
        test_ns = t.api.namespaces['test']
        self.assertIsInstance(test_ns.aliases[0], Alias)
        self.assertEqual(test_ns.aliases[0].name, 'R')
        self.assertIsInstance(test_ns.aliases[0].data_type, String)
        self.assertEqual(
            test_ns.aliases[0].doc, 'This is a test of docstrings')

        # Test aliasing to primitive with additional attributes and nullable
        text = textwrap.dedent("""\
            namespace test

            alias R = String(min_length=1)?
            """)
        t = TowerOfStone([('test.stone', text)])
        t.parse()
        test_ns = t.api.namespaces['test']
        self.assertIsInstance(test_ns.aliases[0], Alias)
        self.assertEqual(test_ns.aliases[0].name, 'R')
        self.assertIsInstance(test_ns.aliases[0].data_type, Nullable)
        self.assertIsInstance(test_ns.aliases[0].data_type.data_type, String)

        # Test aliasing to alias
        text = textwrap.dedent("""\
            namespace test

            alias T = String
            alias R = T
            """)
        t = TowerOfStone([('test.stone', text)])
        t.parse()
        test_ns = t.api.namespaces['test']
        self.assertIsInstance(test_ns.alias_by_name['T'], Alias)
        self.assertIsInstance(test_ns.alias_by_name['R'], Alias)
        self.assertIsInstance(test_ns.alias_by_name['R'].data_type, Alias)
        self.assertEqual(test_ns.alias_by_name['R'].data_type.name, 'T')

        # Test order invariance
        text = textwrap.dedent("""\
            namespace test

            alias R = T
            alias T = String
            """)
        t = TowerOfStone([('test.stone', text)])
        t.parse()

        # Try re-definition
        text = textwrap.dedent("""\
            namespace test

            alias A = String
            alias A = UInt64
            """)
        t = TowerOfStone([('test.stone', text)])
        with self.assertRaises(InvalidSpec) as cm:
            t.parse()
        self.assertIn("Symbol 'A' already defined (test.stone:3).",
                      cm.exception.msg)

        # Try cyclical reference
        text = textwrap.dedent("""\
            namespace test

            alias A = B
            alias B = C
            alias C = A
            """)
        t = TowerOfStone([('test.stone', text)])
        with self.assertRaises(InvalidSpec) as cm:
            t.parse()
        self.assertIn("Alias 'C' is part of a cycle.",
                      cm.exception.msg)

        # Try aliasing to alias with attributes already set.
        text = textwrap.dedent("""\
            namespace test

            alias T = String(min_length=1)
            alias R = T(min_length=1)
            """)
        t = TowerOfStone([('test.stone', text)])
        with self.assertRaises(InvalidSpec) as cm:
            t.parse()
        self.assertIn('Attributes cannot be specified for instantiated type',
                      cm.exception.msg)

        # Test aliasing to composite and making it nullable
        text = textwrap.dedent("""\
            namespace test

            struct S
                f String
            alias R = S?
            """)
        t = TowerOfStone([('test.stone', text)])
        t.parse()
        test_ns = t.api.namespaces['test']
        S_dt = test_ns.data_type_by_name['S']
        self.assertIsInstance(test_ns.alias_by_name['R'].data_type, Nullable)
        self.assertEqual(test_ns.alias_by_name['R'].data_type.data_type, S_dt)

        # Test aliasing to composite with attributes
        text = textwrap.dedent("""\
            namespace test

            struct S
                f String

            alias R = S(min_length=1)
            """)
        t = TowerOfStone([('test.stone', text)])
        with self.assertRaises(InvalidSpec) as cm:
            t.parse()
        self.assertIn('Attributes cannot be specified for instantiated type',
                      cm.exception.msg)

        # Test aliasing from another namespace
        text1 = textwrap.dedent("""\
            namespace test1

            struct S
                f String
            """)
        text2 = textwrap.dedent("""\
            namespace test2

            import test1

            alias S = test1.S
            """)
        t = TowerOfStone([('test1.stone', text1), ('test2.stone', text2)])
        t.parse()
        test1_ns = t.api.namespaces['test1']
        S_dt = test1_ns.data_type_by_name['S']
        test2_ns = t.api.namespaces['test2']
        self.assertEqual(test2_ns.alias_by_name['S'].data_type, S_dt)

        # Try extending an alias-ed struct
        text1 = textwrap.dedent("""\
            namespace test1

            alias Z = S

            struct S
                f1 String

            struct T extends Z
                f2 String
            """)
        t = TowerOfStone([('test1.stone', text1), ('test2.stone', text2)])
        with self.assertRaises(InvalidSpec) as cm:
            t.parse()
        self.assertIn('A struct cannot extend an alias. Use the canonical name instead.',
                      cm.exception.msg)
        self.assertEqual(cm.exception.lineno, 8)

        # Try extending an alias-ed union
        text1 = textwrap.dedent("""\
            namespace test1

            alias Z = S

            union S
                f1 String

            union T extends Z
                f2 String
            """)
        t = TowerOfStone([('test1.stone', text1), ('test2.stone', text2)])
        with self.assertRaises(InvalidSpec) as cm:
            t.parse()
        self.assertIn(
            'A union cannot extend an alias. Use the canonical name instead.',
            cm.exception.msg)
        self.assertEqual(cm.exception.lineno, 8)

    def test_struct_semantics(self):
        # Test field with implicit void type
        text = textwrap.dedent("""\
            namespace test

            struct S
                option_a
            """)
        t = TowerOfStone([('test.stone', text)])
        with self.assertRaises(InvalidSpec) as cm:
            t.parse()
        self.assertEqual("Struct field 'option_a' cannot have a Void type.",
                         cm.exception.msg)

        # Test duplicate fields
        text = textwrap.dedent("""\
            namespace test

            struct A
                a UInt64
                a String
            """)
        t = TowerOfStone([('test.stone', text)])
        with self.assertRaises(InvalidSpec) as cm:
            t.parse()
        self.assertIn('already defined', cm.exception.msg)

        # Test duplicate field name -- earlier being in a parent type
        text = textwrap.dedent("""\
            namespace test

            struct A
                a UInt64

            struct B extends A
                b String

            struct C extends B
                a String
            """)
        t = TowerOfStone([('test.stone', text)])
        with self.assertRaises(InvalidSpec) as cm:
            t.parse()
        self.assertIn('already defined in parent', cm.exception.msg)

        # Test extending from wrong type
        text = textwrap.dedent("""\
            namespace test

            union A
                a

            struct B extends A
                b UInt64
            """)
        t = TowerOfStone([('test.stone', text)])
        with self.assertRaises(InvalidSpec) as cm:
            t.parse()
        self.assertIn('struct can only extend another struct', cm.exception.msg)

    def test_union_semantics(self):
        # Test duplicate fields
        text = textwrap.dedent("""\
            namespace test

            union_closed A
                a UInt64
                a String
            """)
        t = TowerOfStone([('test.stone', text)])
        with self.assertRaises(InvalidSpec) as cm:
            t.parse()
        self.assertIn('already defined', cm.exception.msg)

        # Test duplicate field name -- earlier being in a parent type
        text = textwrap.dedent("""\
            namespace test

            union_closed A
                a UInt64

            union_closed B extends A
                b String

            union_closed C extends B
                a String
            """)
        t = TowerOfStone([('test.stone', text)])
        with self.assertRaises(InvalidSpec) as cm:
            t.parse()
        self.assertIn('already defined in parent', cm.exception.msg)

        # Test catch-all in generator
        text = textwrap.dedent("""\
            namespace test

            union A
                a
                b
            """)
        t = TowerOfStone([('test.stone', text)])
        t.parse()
        A_dt = t.api.namespaces['test'].data_type_by_name['A']
        # Test both ways catch-all is exposed
        self.assertEqual(A_dt.catch_all_field, A_dt._fields_by_name['other'])
        self.assertTrue(A_dt._fields_by_name['other'].catch_all)

        # Try defining a child type as closed if its parent is open
        text = textwrap.dedent("""\
            namespace test

            union A
                a

            union_closed B extends A
                b
            """)
        t = TowerOfStone([('test.stone', text)])
        with self.assertRaises(InvalidSpec) as cm:
            t.parse()
        self.assertEqual(
            "Union cannot be closed since parent type 'A' is open.",
            cm.exception.msg)
        self.assertEqual(cm.exception.lineno, 6)

        # Try explicitly naming field "other"
        text = textwrap.dedent("""\
            namespace test

            union A
                other
            """)
        t = TowerOfStone([('test.stone', text)])
        with self.assertRaises(InvalidSpec) as cm:
            t.parse()
        self.assertEqual(
            "Union cannot define an 'other' field because it is reserved as "
            "the catch-all field for open unions.",
            cm.exception.msg)
        self.assertEqual(cm.exception.lineno, 4)

        # Test extending from wrong type
        text = textwrap.dedent("""\
            namespace test

            struct A
                a UInt64

            union B extends A
                b UInt64
            """)
        t = TowerOfStone([('test.stone', text)])
        with self.assertRaises(InvalidSpec) as cm:
            t.parse()
        self.assertIn('union can only extend another union', cm.exception.msg)

    def test_map_semantics(self):
        text = textwrap.dedent("""\
            namespace test

            alias M = Map(String, Int32)
        """)

        t = TowerOfStone([('test.stone', text)])
        t.parse()
        m_alias = t.api.namespaces['test'].alias_by_name['M']
        self.assertIsInstance(m_alias, Alias)
        self.assertIsInstance(m_alias.data_type, Map)

        # maps of maps
        text = textwrap.dedent("""\
            namespace test

            alias M = Map(String, Map(String, Int32))
        """)

        t = TowerOfStone([('test.stone', text)])
        t.parse()
        m_alias = t.api.namespaces['test'].alias_by_name['M']
        self.assertIsInstance(m_alias.data_type.value_data_type, Map)

        # Map type errors with 0 args
        text = textwrap.dedent("""\
            namespace test

            alias M = Map()
        """)

        # map type errors with only 1 args
        t = TowerOfStone([('test.stone', text)])
        with self.assertRaises(InvalidSpec):
            t.parse()

        text = textwrap.dedent("""\
            namespace test

            alias M = Map(String)
        """)

        # map type errors with more than two args
        t = TowerOfStone([('test.stone', text)])
        with self.assertRaises(InvalidSpec):
            t.parse()

        text = textwrap.dedent("""\
            namespace test

            alias M = Map(String, String, String)
        """)

        t = TowerOfStone([('test.stone', text)])
        with self.assertRaises(InvalidSpec):
            t.parse()

        # map type errors when key data type is not a String
        text = textwrap.dedent("""\
            namespace test

            alias M = Map(Int32, String)
        """)

        t = TowerOfStone([('test.stone', text)])
        with self.assertRaises(InvalidSpec):
            t.parse()

    def test_enumerated_subtypes(self):

        # Test correct definition
        text = textwrap.dedent("""\
            namespace test

            struct Resource
                union
                    file File
                    folder Folder

            struct File extends Resource
                size UInt64

            struct Folder extends Resource
                icon String
            """)
        t = TowerOfStone([('test.stone', text)])
        t.parse()

        # Test reference to non-struct
        text = textwrap.dedent("""\
            namespace test

            struct Resource
                union
                    file String
            """)
        t = TowerOfStone([('test.stone', text)])
        with self.assertRaises(InvalidSpec) as cm:
            t.parse()
        self.assertIn('must be a struct', cm.exception.msg)

        # Test reference to undefined type
        text = textwrap.dedent("""\
            namespace test

            struct Resource
                union
                    file File
            """)
        t = TowerOfStone([('test.stone', text)])
        with self.assertRaises(InvalidSpec) as cm:
            t.parse()
        self.assertIn('Undefined', cm.exception.msg)

        # Test reference to non-subtype
        text = textwrap.dedent("""\
            namespace test

            struct Resource
                union
                    file File

            struct File
                size UInt64
            """)
        t = TowerOfStone([('test.stone', text)])
        with self.assertRaises(InvalidSpec) as cm:
            t.parse()
        self.assertIn('not a subtype of', cm.exception.msg)

        # Test subtype listed more than once
        text = textwrap.dedent("""\
            namespace test

            struct Resource
                union
                    file File
                    file2 File

            struct File extends Resource
                size UInt64
            """)
        t = TowerOfStone([('test.stone', text)])
        with self.assertRaises(InvalidSpec) as cm:
            t.parse()
        self.assertIn('only be specified once', cm.exception.msg)

        # Test missing subtype
        text = textwrap.dedent("""\
            namespace test

            struct Resource
                union
                    file File

            struct File extends Resource
                size UInt64

            struct Folder extends Resource
                icon String
            """)
        t = TowerOfStone([('test.stone', text)])
        with self.assertRaises(InvalidSpec) as cm:
            t.parse()
        self.assertIn("missing 'Folder'", cm.exception.msg)

        # Test name conflict with field
        text = textwrap.dedent("""\
            namespace test

            struct Resource
                union
                    file File
                file String

            struct File extends Resource
                size UInt64
            """)
        t = TowerOfStone([('test.stone', text)])
        with self.assertRaises(InvalidSpec) as cm:
            t.parse()
        self.assertIn("already defined on", cm.exception.msg)

        # Test if a leaf and its parent do not enumerate subtypes, but its
        # grandparent does.
        text = textwrap.dedent("""\
            namespace test

            struct A
                union
                    b B
                c String

            struct B extends A
                "No enumerated subtypes."

            struct C extends B
                "No enumerated subtypes."
            """)
        t = TowerOfStone([('test.stone', text)])
        with self.assertRaises(InvalidSpec) as cm:
            t.parse()
        self.assertIn("cannot be extended", cm.exception.msg)

    def unused_enumerated_subtypes_tests(self):
        # Currently, Stone does not allow for a struct that enumerates subtypes
        # to inherit from another struct that does. These tests only apply if
        # this restriction is removed.

        # Test name conflict with field in parent
        text = textwrap.dedent("""\
            namespace test

            struct A
                union
                    b B
                c String

            struct B extends A
                union
                    c C

            struct C extends B
                d String
            """)
        t = TowerOfStone([('test.stone', text)])
        with self.assertRaises(InvalidSpec) as cm:
            t.parse()
        self.assertIn("already defined in parent", cm.exception.msg)

        # Test name conflict with union field in parent
        text = textwrap.dedent("""\
            namespace test

            struct A
                union
                    b B
                c String

            struct B extends A
                union
                    b C

            struct C extends B
                d String
            """)
        t = TowerOfStone([('test.stone', text)])
        with self.assertRaises(InvalidSpec) as cm:
            t.parse()
        self.assertIn("already defined in parent", cm.exception.msg)

        # Test non-leaf with no enumerated subtypes
        text = textwrap.dedent("""\
            namespace test

            struct A
                union
                    b B
                c String

            struct B extends A
                "No enumerated subtypes."

            struct C extends B
                union
                    d D

            struct D extends C
                e String
            """)
        t = TowerOfStone([('test.stone', text)])
        with self.assertRaises(InvalidSpec) as cm:
            t.parse()
        self.assertIn("cannot enumerate subtypes if parent", cm.exception.msg)

    def test_nullable(self):
        # Test stacking nullable
        text = textwrap.dedent("""\
            namespace test

            alias A = String?
            alias B = A?
            """)
        t = TowerOfStone([('test.stone', text)])
        with self.assertRaises(InvalidSpec) as cm:
            t.parse()
        self.assertEqual(
            'Cannot mark reference to nullable type as nullable.',
            cm.exception.msg)

        # Test stacking nullable
        text = textwrap.dedent("""\
            namespace test

            alias A = String?

            struct S
                f A?
            """)
        t = TowerOfStone([('test.stone', text)])
        with self.assertRaises(InvalidSpec) as cm:
            t.parse()
        self.assertEqual(
            'Cannot mark reference to nullable type as nullable.',
            cm.exception.msg)

        # Test extending nullable
        text = textwrap.dedent("""\
            namespace test

            struct S
                f String

            struct T extends S?
                g String
            """)
        t = TowerOfStone([('test.stone', text)])
        with self.assertRaises(InvalidSpec) as cm:
            t.parse()
        self.assertEqual(
            'Reference cannot be nullable.',
            cm.exception.msg)

    def test_forward_reference(self):
        # Test route def before struct def
        text = textwrap.dedent("""\
            namespace test

            route test_route(Void, S, Void)

            struct S
                f String
            """)
        t = TowerOfStone([('test.stone', text)])
        t.parse()

        # Test extending after...
        text = textwrap.dedent("""\
            namespace test

            struct T extends S
                g String

            struct S
                f String
            """)
        t = TowerOfStone([('test.stone', text)])
        t.parse()

        # Test field ref to later-defined struct
        text = textwrap.dedent("""\
            namespace test

            route test_route(Void, T, Void)

            struct T
                s S

            struct S
                f String
            """)
        t = TowerOfStone([('test.stone', text)])
        t.parse()

        # Test self-reference
        text = textwrap.dedent("""\
            namespace test

            struct S
                s S?
            """)
        t = TowerOfStone([('test.stone', text)])
        t.parse()

        # Test forward union ref
        text = textwrap.dedent("""\
            namespace test

            struct S
                s U = a

            union U
                a
            """)
        t = TowerOfStone([('test.stone', text)])
        t.parse()
        self.assertTrue(t.api.namespaces['test'].data_types[0].fields[0].has_default)
        self.assertEqual(
            t.api.namespaces['test'].data_types[0].fields[0].default.union_data_type,
            t.api.namespaces['test'].data_types[1])
        self.assertEqual(
            t.api.namespaces['test'].data_types[0].fields[0].default.tag_name, 'a')

    def test_import(self):
        # Test field reference to another namespace
        ns1_text = textwrap.dedent("""\
            namespace ns1

            import ns2

            struct S
                f ns2.S
            """)
        ns2_text = textwrap.dedent("""\
            namespace ns2

            struct S
                f String
            """)
        t = TowerOfStone([('ns1.stone', ns1_text), ('ns2.stone', ns2_text)])
        t.parse()

        # Test incorrectly importing the current namespace
        text = textwrap.dedent("""\
            namespace test
            import test
            """)
        t = TowerOfStone([('test.stone', text)])
        with self.assertRaises(InvalidSpec) as cm:
            t.parse()
        self.assertEqual(
            'Cannot import current namespace.',
            cm.exception.msg)

        # Test importing a non-existent namespace
        text = textwrap.dedent("""\
            namespace test
            import missingns
            """)
        t = TowerOfStone([('test.stone', text)])
        with self.assertRaises(InvalidSpec) as cm:
            t.parse()
        self.assertEqual(
            "Namespace 'missingns' is not defined in any spec.",
            cm.exception.msg)

        # Test extending struct from another namespace
        ns1_text = textwrap.dedent("""\
            namespace ns1

            import ns2

            struct S extends ns2.T
                f String
            """)
        ns2_text = textwrap.dedent("""\
            namespace ns2

            struct T
                g String
            """)
        t = TowerOfStone([('ns1.stone', ns1_text), ('ns2.stone', ns2_text)])
        t.parse()

        # Test extending aliased struct from another namespace
        ns1_text = textwrap.dedent("""\
            namespace ns1

            import ns2

            struct S extends ns2.X
                f String
            """)
        ns2_text = textwrap.dedent("""\
            namespace ns2

            alias X = T

            struct T
                g String
            """)
        t = TowerOfStone([('ns1.stone', ns1_text), ('ns2.stone', ns2_text)])
        with self.assertRaises(InvalidSpec) as cm:
            t.parse()
        self.assertEqual(
            'A struct cannot extend an alias. Use the canonical name instead.',
            cm.exception.msg)

        # Test extending union from another namespace
        ns1_text = textwrap.dedent("""\
            namespace ns1

            import ns2

            union V extends ns2.U
                b String
            """)
        ns2_text = textwrap.dedent("""\
            namespace ns2

            union U
                a
            """)
        t = TowerOfStone([('ns1.stone', ns1_text), ('ns2.stone', ns2_text)])
        t.parse()

        # Try circular import
        ns1_text = textwrap.dedent("""\
            namespace ns1

            import ns2

            struct S
                t ns2.T
            """)
        ns2_text = textwrap.dedent("""\
            namespace ns2

            import ns1

            struct T
                s ns1.S
            """)
        t = TowerOfStone([('ns1.stone', ns1_text), ('ns2.stone', ns2_text)])
        with self.assertRaises(InvalidSpec) as cm:
            t.parse()
        self.assertIn(
            "Circular import of namespaces 'ns2' and 'ns1' detected.",
            cm.exception.msg)

    def test_doc_refs(self):
        # Test union doc referencing field
        text = textwrap.dedent("""\
            namespace test

            union U
                ":field:`a`"
                a
                b
            """)
        t = TowerOfStone([('test.stone', text)])
        t.parse()

        # Test union field doc referencing other field
        text = textwrap.dedent("""\
            namespace test

            union U
                a
                    ":field:`b`"
                b
            """)
        t = TowerOfStone([('test.stone', text)])
        t.parse()

    def test_namespace(self):
        # Test that namespace docstrings are combined
        ns1_text = textwrap.dedent("""\
        namespace ns1
            "
            This is a docstring for ns1.
            "

        struct S
            f String
        """)
        ns2_text = textwrap.dedent("""\
            namespace ns1
                "
                This is another docstring for ns1.
                "

            struct S2
                f String
            """)
        t = TowerOfStone([('ns1.stone', ns1_text), ('ns2.stone', ns2_text)])
        t.parse()
        self.assertEqual(
            t.api.namespaces['ns1'].doc,
            'This is a docstring for ns1.\nThis is another docstring for ns1.\n')

    def test_examples(self):

        # Test simple struct example
        text = textwrap.dedent("""\
            namespace test

            struct S
                f String

                example default
                    f = "A"
            """)
        t = TowerOfStone([('test.stone', text)])
        t.parse()
        s_dt = t.api.namespaces['test'].data_types[0]
        self.assertTrue(s_dt.get_examples()['default'], {'f': 'A'})

        # Test example with bad type
        text = textwrap.dedent("""\
            namespace test

            struct S
                f String

                example default
                    f = 5
            """)
        t = TowerOfStone([('test.stone', text)])
        with self.assertRaises(InvalidSpec) as cm:
            t.parse()
        self.assertEqual(
            "Bad example for field 'f': integer is not a valid string",
            cm.exception.msg)

        # Test example with label "true". "false" and "null" are also
        # disallowed because they conflict with the identifiers for primitives.
        text = textwrap.dedent("""\
            namespace test

            struct S
                f String

                example true
                    f = "A"
            """)
        t = TowerOfStone([('test.stone', text)])
        with self.assertRaises(InvalidSpec) as cm:
            # This raises an unexpected token error.
            t.parse()

        # Test error case where two examples share the same label
        text = textwrap.dedent("""\
            namespace test

            struct S
                f String

                example default
                    f = "ZZZZZZ3"
                example default
                    f = "ZZZZZZ4"
            """)
        t = TowerOfStone([('test.stone', text)])
        with self.assertRaises(InvalidSpec) as cm:
            t.parse()
        self.assertEqual(
            "Example with label 'default' already defined on line 6.",
            cm.exception.msg)

        # Test error case where an example has the same field defined twice.
        text = textwrap.dedent("""\
            namespace test

            struct S
                f String

                example default
                    f = "ZZZZZZ3"
                    f = "ZZZZZZ4"
            """)
        t = TowerOfStone([('test.stone', text)])
        with self.assertRaises(InvalidSpec) as cm:
            t.parse()
        self.assertEqual(
            "Example with label 'default' defines field 'f' more than once.",
            cm.exception.msg)

        # Test empty examples
        text = textwrap.dedent("""\
            namespace test

            struct S

                example default
                example other
            """)
        t = TowerOfStone([('test.stone', text)])
        t.parse()
        s_dt = t.api.namespaces['test'].data_types[0]
        self.assertIn('default', s_dt.get_examples())
        self.assertIn('other', s_dt.get_examples())
        self.assertNotIn('missing', s_dt.get_examples())

        # Test missing field in example
        text = textwrap.dedent("""\
            namespace test

            struct S
                f String

                example default
            """)
        t = TowerOfStone([('test.stone', text)])
        with self.assertRaises(InvalidSpec) as cm:
            t.parse()
        self.assertEqual(
            "Missing field 'f' in example.",
            cm.exception.msg)

        # Test missing default example
        text = textwrap.dedent("""\
            namespace test

            struct S
                t T

                example default

            struct T
                f String
            """)
        t = TowerOfStone([('test.stone', text)])
        with self.assertRaises(InvalidSpec) as cm:
            t.parse()
        self.assertEqual(
            "Missing field 't' in example.",
            cm.exception.msg)

        # Test primitive field with default will use the default in the
        # example if it's missing.
        text = textwrap.dedent("""\
            namespace test

            struct S
                f String = "S"

                example default
            """)
        t = TowerOfStone([('test.stone', text)])
        t.parse()
        s_dt = t.api.namespaces['test'].data_types[0]
        # Example should have no keys
        self.assertEqual(s_dt.get_examples()['default'].value['f'], 'S')

        # Test nullable primitive field missing from example
        text = textwrap.dedent("""\
            namespace test

            struct S
                f String?

                example default
            """)
        t = TowerOfStone([('test.stone', text)])
        t.parse()
        s_dt = t.api.namespaces['test'].data_types[0]
        # Example should have no keys
        self.assertEqual(len(s_dt.get_examples()['default'].value), 0)

        # Test nullable primitive field explicitly set to null in example
        text = textwrap.dedent("""\
            namespace test

            struct S
                f String?

                example default
                    f = null
            """)
        t = TowerOfStone([('test.stone', text)])
        t.parse()
        s_dt = t.api.namespaces['test'].data_types[0]
        # Example should have no keys
        self.assertEqual(len(s_dt.get_examples()['default'].value), 0)

        # Test non-nullable primitive field explicitly set to null in example
        text = textwrap.dedent("""\
            namespace test

            struct S
                f String

                example default
                    f = null
            """)
        t = TowerOfStone([('test.stone', text)])
        with self.assertRaises(InvalidSpec) as cm:
            t.parse()
        self.assertEqual(
            "Bad example for field 'f': null is not a valid string",
            cm.exception.msg)

        # Test example of composite type
        text = textwrap.dedent("""\
            namespace test

            struct S
                t T

                example default
                    t = default

            struct T
                f String

                example default
                    f = "A"
            """)
        t = TowerOfStone([('test.stone', text)])
        t.parse()
        s_dt = t.api.namespaces['test'].data_type_by_name['S']
        self.assertEqual(s_dt.get_examples()['default'].value,
                         {'t': {'f': 'A'}})

        # Test nullable composite missing from example
        text = textwrap.dedent("""\
            namespace test

            struct S
                t T?

                example default
                    t = default

            struct T
                f String

                example default
                    f = "A"
            """)
        t = TowerOfStone([('test.stone', text)])
        t.parse()
        s_dt = t.api.namespaces['test'].data_type_by_name['S']
        self.assertEqual(s_dt.get_examples()['default'].value,
                         {'t': {'f': 'A'}})

        # Test nullable composite explicitly set to null
        text = textwrap.dedent("""\
            namespace test

            struct S
                t T?

                example default
                    t = null

            struct T
                f String

                example default
                    f = "A"
            """)
        t = TowerOfStone([('test.stone', text)])
        t.parse()
        s_dt = t.api.namespaces['test'].data_type_by_name['S']
        self.assertEqual(s_dt.get_examples()['default'].value,
                         {})

        # Test custom label
        text = textwrap.dedent("""\
            namespace test

            struct S
                t T?

                example default
                    t = special

            struct T
                f String
                r R

                example default
                    f = "A"
                    r = default

                example special
                    f = "B"
                    r = other

            struct R
                g String

                example default
                    g = "D"

                example other
                    g = "C"
            """)
        t = TowerOfStone([('test.stone', text)])
        t.parse()
        s_dt = t.api.namespaces['test'].data_type_by_name['S']
        self.assertEqual(s_dt.get_examples()['default'].value,
                         {'t': {'f': 'B', 'r': {'g': 'C'}}})

        # Test missing label for composite example
        text = textwrap.dedent("""\
            namespace test

            struct S
                t T?

                example default
                    t = missing

            struct T
                f String
            """)
        t = TowerOfStone([('test.stone', text)])
        with self.assertRaises(InvalidSpec) as cm:
            t.parse()
        self.assertEqual(
            "Reference to example for 'T' with label 'missing' does not exist.",
            cm.exception.msg)
        self.assertEqual(cm.exception.lineno, 7)

        # Test missing label for composite example
        text = textwrap.dedent("""\
            namespace test

            struct S
                t T

                example default

            struct T
                f String
            """)
        t = TowerOfStone([('test.stone', text)])
        with self.assertRaises(InvalidSpec) as cm:
            t.parse()
        self.assertEqual(
            "Missing field 't' in example.",
            cm.exception.msg)
        self.assertEqual(cm.exception.lineno, 6)

        # Test bad label for composite example
        text = textwrap.dedent("""\
            namespace test

            struct S
                t T?

                example default
                    t = 34

            struct T
                f String
            """)
        t = TowerOfStone([('test.stone', text)])
        with self.assertRaises(InvalidSpec) as cm:
            t.parse()
        self.assertEqual(
            "Bad example for field 't': example must reference label of 'T'",
            cm.exception.msg)
        self.assertEqual(cm.exception.lineno, 7)

        # Test solution for recursive struct
        # TODO: Omitting `s=null` will result in infinite recursion.
        text = textwrap.dedent("""\
            namespace test

            struct S
                s S?
                f String

                example default
                    f = "A"
                    s = null
            """)
        t = TowerOfStone([('test.stone', text)])
        t.parse()
        s_dt = t.api.namespaces['test'].data_type_by_name['S']
        self.assertEqual(s_dt.get_examples()['default'].value, {'f': 'A'})

        # Test examples with inheritance trees
        text = textwrap.dedent("""\
            namespace test

            struct A
                a String

            struct B extends A
                b String

            struct C extends B
                c String

                example default
                    a = "A"
                    b = "B"
                    c = "C"
            """)
        t = TowerOfStone([('test.stone', text)])
        t.parse()

        text = textwrap.dedent("""\
            namespace test

            struct A
                a String

            struct B extends A
                b String

            struct C extends B
                c String

                example default
                    b = "B"
                    c = "C"
            """)
        t = TowerOfStone([('test.stone', text)])
        with self.assertRaises(InvalidSpec) as cm:
            t.parse()
        self.assertEqual(
            "Missing field 'a' in example.",
            cm.exception.msg)

    def test_examples_union(self):
        # Test bad example with no fields specified
        text = textwrap.dedent("""\
            namespace test

            union U
                a

                example default
            """)
        t = TowerOfStone([('test.stone', text)])
        with self.assertRaises(InvalidSpec) as cm:
            t.parse()
        self.assertEqual(
            'Example for union must specify exactly one tag.',
            cm.exception.msg)

        # Test bad example with more than one field specified
        text = textwrap.dedent("""\
            namespace test

            union U
                a String
                b String

                example default
                    a = "A"
                    b = "B"
            """)
        t = TowerOfStone([('test.stone', text)])
        with self.assertRaises(InvalidSpec) as cm:
            t.parse()
        self.assertEqual(
            'Example for union must specify exactly one tag.',
            cm.exception.msg)

        # Test bad example with unknown tag
        text = textwrap.dedent("""\
            namespace test

            union U
                a String

                example default
                    z = "Z"
            """)
        t = TowerOfStone([('test.stone', text)])
        with self.assertRaises(InvalidSpec) as cm:
            t.parse()
        self.assertEqual(
            "Unknown tag 'z' in example.",
            cm.exception.msg)

        # Test bad example with reference
        text = textwrap.dedent("""\
            namespace test

            union U
                a String

                example default
                    a = default
            """)
        t = TowerOfStone([('test.stone', text)])
        with self.assertRaises(InvalidSpec) as cm:
            t.parse()
        self.assertEqual(
            "Bad example for field 'a': reference is not a valid string",
            cm.exception.msg)

        # Test bad example with null value for non-nullable
        text = textwrap.dedent("""\
            namespace test

            union U
                a String

                example default
                    a = null
            """)
        t = TowerOfStone([('test.stone', text)])
        with self.assertRaises(InvalidSpec) as cm:
            t.parse()
        self.assertEqual(
            "Bad example for field 'a': null is not a valid string",
            cm.exception.msg)

        # Test example with null value for void type member
        text = textwrap.dedent("""\
            namespace test

            union U
                a

                example default
                    a = null
            """)
        t = TowerOfStone([('test.stone', text)])
        t.parse()
        u_dt = t.api.namespaces['test'].data_type_by_name['U']
        self.assertEqual(u_dt.get_examples()['default'].value, {'.tag': 'a'})
        self.assertEqual(u_dt.get_examples(compact=True)['default'].value, 'a')

        # Test simple union
        text = textwrap.dedent("""\
            namespace test

            union U
                a
                b String
                c UInt64

                example default
                    b = "A"
            """)
        t = TowerOfStone([('test.stone', text)])
        t.parse()
        u_dt = t.api.namespaces['test'].data_type_by_name['U']
        self.assertEqual(u_dt.get_examples()['default'].value,
                         {'.tag': 'b', 'b': 'A'})
        self.assertEqual(u_dt.get_examples()['a'].value, {'.tag': 'a'})
        self.assertEqual(u_dt.get_examples(compact=True)['a'].value, 'a')
        self.assertNotIn('b', u_dt.get_examples())

        # Test union with inheritance
        text = textwrap.dedent("""\
            namespace test

            union U
                a String

            union V extends U
                b String

                example default
                    a = "A"
            """)
        t = TowerOfStone([('test.stone', text)])
        t.parse()
        v_dt = t.api.namespaces['test'].data_type_by_name['V']
        self.assertEqual(v_dt.get_examples()['default'].value,
                         {'.tag': 'a', 'a': 'A'})

        # Test union and struct
        text = textwrap.dedent("""\
            namespace test

            union U
                a
                s S

                example default
                    s = default

                example opt
                    s = opt

            struct S
                f String

                example default
                    f = "F"

                example opt
                    f = "O"
            """)
        t = TowerOfStone([('test.stone', text)])
        t.parse()
        u_dt = t.api.namespaces['test'].data_type_by_name['U']
        self.assertEqual(u_dt.get_examples()['default'].value,
                         {'.tag': 's', 'f': 'F'})
        self.assertEqual(u_dt.get_examples()['opt'].value,
                         {'.tag': 's', 'f': 'O'})
        self.assertEqual(list(u_dt.get_examples()['default'].value.keys())[0],
                         '.tag')

        # Test union referencing non-existent struct example
        text = textwrap.dedent("""\
            namespace test

            union U
                a
                s S

                example default
                    s = missing

            struct S
                f String
            """)
        t = TowerOfStone([('test.stone', text)])
        with self.assertRaises(InvalidSpec) as cm:
            t.parse()
        self.assertEqual(
            "Reference to example for 'S' with label 'missing' does not exist.",
            cm.exception.msg)

        # Test fallback to union void member
        text = textwrap.dedent("""\
            namespace test

            struct S
                u U

                example default
                    u = a

            union U
                a
                b
            """)
        t = TowerOfStone([('test.stone', text)])
        t.parse()
        s_dt = t.api.namespaces['test'].data_type_by_name['S']
        self.assertEqual(s_dt.get_examples()['default'].value,
                         {'u': {'.tag': 'a'}})
        self.assertEqual(s_dt.get_examples(compact=True)['default'].value,
                         {'u': 'a'})

        # Test fallback to union member of composite type
        text = textwrap.dedent("""\
            namespace test

            struct S
                u U

                example default
                    u = default

            union U
                a
                b S2?

                example default
                    b = default

            struct S2
                f String

                example default
                    f = "F"
            """)
        t = TowerOfStone([('test.stone', text)])
        t.parse()
        s_dt = t.api.namespaces['test'].data_type_by_name['S']
        self.assertEqual(s_dt.get_examples()['default'].value,
                         {'u': {'.tag': 'b', 'f': 'F'}})

        # Test TagRef
        text = textwrap.dedent("""\
            namespace test

            union U
                a
                b

            struct S
                u U = a

                example default
            """)
        t = TowerOfStone([('test.stone', text)])
        t.parse()
        s_dt = t.api.namespaces['test'].data_type_by_name['S']
        self.assertEqual(s_dt.get_examples()['default'].value,
                         {'u': {'.tag': 'a'}})
        self.assertEqual(s_dt.get_examples(compact=True)['default'].value,
                         {'u': 'a'})

        # Try TagRef to non-void option
        text = textwrap.dedent("""\
            namespace test

            union U
                a UInt64
                b

            struct S
                u U = a

                example default
            """)
        t = TowerOfStone([('test.stone', text)])
        with self.assertRaises(InvalidSpec) as cm:
            t.parse()
        self.assertEqual(
            "Field 'u' has an invalid default: invalid reference to non-void option 'a'",
            cm.exception.msg)

        # Try TagRef to non-existent option
        text = textwrap.dedent("""\
            namespace test

            union U
                a UInt64
                b

            struct S
                u U = c

                example default
            """)
        t = TowerOfStone([('test.stone', text)])
        with self.assertRaises(InvalidSpec) as cm:
            t.parse()
        self.assertEqual(
            "Field 'u' has an invalid default: invalid reference to unknown tag 'c'",
            cm.exception.msg)

        # Test bad void union member example value
        text = textwrap.dedent("""\
            namespace test

            union U
                a

                example default
                    a = false
            """)
        t = TowerOfStone([('test.stone', text)])
        with self.assertRaises(InvalidSpec) as cm:
            t.parse()
        self.assertEqual(
            "Bad example for field 'a': example of void type must be null",
            cm.exception.msg)

    def test_examples_text(self):
        # Test multi-line example text (verify it gets unwrapp-ed)
        text = textwrap.dedent("""\
            namespace test

            struct S
                a String

                example default
                    "This is the text for the example.
                    And I guess it's kind of long."
                    a = "Hello, World."
            """)
        t = TowerOfStone([('test.stone', text)])
        t.parse()
        s_dt = t.api.namespaces['test'].data_type_by_name['S']
        example = s_dt.get_examples()['default']
        self.assertEqual(
            example.text,
            "This is the text for the example. And I guess it's kind of long.")

        # Test union example
        text = textwrap.dedent("""\
            namespace test

            union U
                a
                b String

                example default
                    "This is the text for the example.
                    And I guess it's kind of long."
                    b = "Hi, World."
            """)
        t = TowerOfStone([('test.stone', text)])
        t.parse()
        u_dt = t.api.namespaces['test'].data_type_by_name['U']
        example = u_dt.get_examples()['default']
        self.assertEqual(
            example.text,
            "This is the text for the example. And I guess it's kind of long.")

    def test_examples_enumerated_subtypes(self):
        # Test missing custom example
        text = textwrap.dedent("""\
            namespace test

            struct S
                t T

                example other

            struct T
                f String
            """)
        t = TowerOfStone([('test.stone', text)])
        with self.assertRaises(InvalidSpec) as cm:
            t.parse()
        self.assertEqual(
            "Missing field 't' in example.",
            cm.exception.msg)

        # Test with two subtypes referenced
        text = textwrap.dedent("""\
            namespace test

            struct R
                union
                    s S
                    t T
                a String

                example default
                    s = default
                    t = default

            struct S extends R
                b String

            struct T extends R
                c String
            """)
        t = TowerOfStone([('test.stone', text)])
        with self.assertRaises(InvalidSpec) as cm:
            t.parse()
        self.assertEqual(
            "Example for struct with enumerated subtypes must only specify one subtype tag.",
            cm.exception.msg)
        self.assertEqual(cm.exception.lineno, 9)

        # Test bad subtype reference
        text = textwrap.dedent("""\
            namespace test

            struct R
                union
                    s S
                    t T
                a String

                example default
                    s = 34

            struct S extends R
                b String

            struct T extends R
                c String
            """)
        t = TowerOfStone([('test.stone', text)])
        with self.assertRaises(InvalidSpec) as cm:
            t.parse()
        self.assertEqual(
            "Example of struct with enumerated subtypes must be a reference "
            "to a subtype's example.",
            cm.exception.msg)
        self.assertEqual(cm.exception.lineno, 10)

        # Test unknown subtype
        text = textwrap.dedent("""\
            namespace test

            struct R
                union
                    s S
                    t T
                a String

                example default
                    z = default

            struct S extends R
                b String

            struct T extends R
                c String
            """)
        t = TowerOfStone([('test.stone', text)])
        with self.assertRaises(InvalidSpec) as cm:
            t.parse()
        self.assertEqual(
            "Unknown subtype tag 'z' in example.",
            cm.exception.msg)
        self.assertEqual(cm.exception.lineno, 10)

        # Test correct example of enumerated subtypes
        text = textwrap.dedent("""\
            namespace test

            struct R
                union
                    s S
                    t T
                a String

                example default
                    s = default

            struct S extends R
                b String

                example default
                    a = "A"
                    b = "B"

            struct T extends R
                c String
            """)
        t = TowerOfStone([('test.stone', text)])
        t.parse()
        r_dt = t.api.namespaces['test'].data_type_by_name['R']
        self.assertEqual(r_dt.get_examples()['default'].value,
                         {'.tag': 's', 'a': 'A', 'b': 'B'})
        self.assertEqual(list(r_dt.get_examples()['default'].value.keys())[0],
                         '.tag')

        # Test missing custom example
        text = textwrap.dedent("""\
            namespace test

            struct R
                union
                    s S
                    t T
                a String

                example default
                    s = default

            struct S extends R
                b String

            struct T extends R
                c String
            """)
        t = TowerOfStone([('test.stone', text)])
        with self.assertRaises(InvalidSpec) as cm:
            t.parse()
        self.assertEqual(
            "Reference to example for 'S' with label 'default' does not exist.",
            cm.exception.msg)

    def test_examples_list(self):

        # Test field of list of primitives with bad example
        text = textwrap.dedent("""\
            namespace test

            struct S
                l List(String)

                example default
                    l = "a"
            """)
        t = TowerOfStone([('test.stone', text)])
        with self.assertRaises(InvalidSpec) as cm:
            t.parse()
        self.assertEqual(
            "Bad example for field 'l': string is not a valid list",
            cm.exception.msg)

        # Test field of list of primitives
        text = textwrap.dedent("""\
            namespace test

            struct S
                l List(String)

                example default
                    l = ["a", "b", "c"]
            """)
        t = TowerOfStone([('test.stone', text)])
        t.parse()
        s_dt = t.api.namespaces['test'].data_type_by_name['S']
        self.assertEqual(s_dt.get_examples()['default'].value,
                         {'l': ['a', 'b', 'c']})

        # Test nullable field of list of primitives
        text = textwrap.dedent("""\
            namespace test

            struct S
                l List(String)?
                l2 List(String)?

                example default
                    l = ["a", "b", "c"]
                    l2 = null
            """)
        t = TowerOfStone([('test.stone', text)])
        t.parse()
        s_dt = t.api.namespaces['test'].data_type_by_name['S']
        self.assertEqual(s_dt.get_examples()['default'].value,
                         {'l': ['a', 'b', 'c']})

        # Test field of list of nullable primitives
        text = textwrap.dedent("""\
            namespace test

            struct S
                l List(String?)

                example default
                    l = ["a", null, "c"]
            """)
        t = TowerOfStone([('test.stone', text)])
        t.parse()
        s_dt = t.api.namespaces['test'].data_type_by_name['S']
        self.assertEqual(s_dt.get_examples()['default'].value,
                         {'l': ['a', None, 'c']})

        # Test example of list of composite types with bad example
        text = textwrap.dedent("""\
            namespace test

            struct S
                l List(T)

                example default
                    l = default

            struct T
                f String

                example default
                    f = "A"
            """)
        t = TowerOfStone([('test.stone', text)])
        with self.assertRaises(InvalidSpec) as cm:
            t.parse()
        self.assertEqual(
            "Bad example for field 'l': reference is not a valid list",
            cm.exception.msg)

        # Test example of list of composite types
        text = textwrap.dedent("""\
            namespace test

            struct S
                l List(T)
                l2 List(T)?
                l3 List(T)?

                example default
                    l = [default, default]
                    l2 = [default]
                    l3 = null

            struct T
                f String

                example default
                    f = "A"
            """)
        t = TowerOfStone([('test.stone', text)])
        t.parse()
        s_dt = t.api.namespaces['test'].data_type_by_name['S']
        self.assertEqual(s_dt.get_examples()['default'].value,
                         {'l': [{'f': 'A'}, {'f': 'A'}],
                          'l2': [{'f': 'A'}]})

        # Test example of list of nullable composite types
        text = textwrap.dedent("""\
            namespace test

            struct S
                l List(T?)

                example default
                    l = [default, null]

            struct T
                f String

                example default
                    f = "A"
            """)
        t = TowerOfStone([('test.stone', text)])
        t.parse()
        s_dt = t.api.namespaces['test'].data_type_by_name['S']
        self.assertEqual(s_dt.get_examples()['default'].value,
                         {'l': [{'f': 'A'}, None]})

        # Test example of list of list of primitives
        text = textwrap.dedent("""\
            namespace test

            struct S
                l List(List(String))

                example default
                    l = [["a", "b"], [], ["z"]]
            """)
        t = TowerOfStone([('test.stone', text)])
        t.parse()
        s_dt = t.api.namespaces['test'].data_type_by_name['S']
        self.assertEqual(s_dt.get_examples()['default'].value,
                         {'l': [['a', 'b'], [], ["z"]]})

        # Test example of list of list of primitives with parameterization
        text = textwrap.dedent("""\
            namespace test

            struct S
                l List(List(String, max_items=1))

                example default
                    l = [["a", "b"], [], ["z"]]
            """)
        t = TowerOfStone([('test.stone', text)])
        with self.assertRaises(InvalidSpec) as cm:
            t.parse()
        self.assertEqual(
            "Bad example for field 'l': list has more than 1 item(s)",
            cm.exception.msg)

        # Test union with list (bad example)
        text = textwrap.dedent("""\
            namespace test

            union U
                a List(String)

                example default
                    a = "hi"
            """)
        t = TowerOfStone([('test.stone', text)])
        with self.assertRaises(InvalidSpec) as cm:
            t.parse()
        self.assertEqual(
            "Bad example for field 'a': string is not a valid list",
            cm.exception.msg)

        # Test union with list of primitives
        text = textwrap.dedent("""\
            namespace test

            union U
                a List(String)

                example default
                    a = ["hello", "world"]
            """)
        t = TowerOfStone([('test.stone', text)])
        t.parse()
        s_dt = t.api.namespaces['test'].data_type_by_name['U']
        self.assertEqual(s_dt.get_examples()['default'].value,
                         {".tag": "a", 'a': ["hello", "world"]})

        # Test union with list of composites
        text = textwrap.dedent("""\
            namespace test

            union U
                a List(S)
                b List(S)?

                example default
                    a = [default, default]

                example default_b
                    b = [default]

            struct S
                f String

                example default
                    f = "A"
            """)
        t = TowerOfStone([('test.stone', text)])
        t.parse()
        s_dt = t.api.namespaces['test'].data_type_by_name['U']
        self.assertEqual(s_dt.get_examples()['default'].value,
                         {'.tag': 'a', 'a': [{'f': 'A'}, {'f': 'A'}]})
        self.assertEqual(s_dt.get_examples()['default_b'].value,
                         {'.tag': 'b', 'b': [{'f': 'A'}]})

        # Test union with list of lists of composites
        text = textwrap.dedent("""\
            namespace test

            union U
                a List(List(S))

                example default
                    a = [[default]]

            struct S
                f String

                example default
                    f = "A"
            """)
        t = TowerOfStone([('test.stone', text)])
        t.parse()
        u_dt = t.api.namespaces['test'].data_type_by_name['U']
        self.assertEqual(u_dt.get_examples()['default'].value,
                         {'.tag': 'a', 'a': [[{'f': 'A'}]]})

        # Test union with list of list of primitives
        text = textwrap.dedent("""\
            namespace test

            union U
                a List(List(String))

                example default
                    a = [["hello", "world"]]
            """)
        t = TowerOfStone([('test.stone', text)])
        t.parse()
        u_dt = t.api.namespaces['test'].data_type_by_name['U']
        self.assertEqual(u_dt.get_examples()['default'].value,
                         {'.tag': 'a', 'a': [['hello', 'world']]})

        # Test union with list of primitives
        text = textwrap.dedent("""\
            namespace test

            union U
                a List(List(String))

                example default
                    a = 42
            """)
        t = TowerOfStone([('test.stone', text)])
        with self.assertRaises(InvalidSpec) as cm:
            t.parse()
        self.assertEqual(
            "Bad example for field 'a': integer is not a valid list",
            cm.exception.msg)

        # Test union with list of list of structs
        text = textwrap.dedent("""\
            namespace test

            union U
                a List(List(S))

                example default
                    a = [[default, special]]

            struct S
                a UInt64

                example default
                    a = 42

                example special
                    a = 100
            """)
        t = TowerOfStone([('test.stone', text)])
        t.parse()
        u_dt = t.api.namespaces['test'].data_type_by_name['U']
        self.assertEqual(u_dt.get_examples()['default'].value,
                         {'.tag': 'a', 'a': [[{'a': 42}, {'a': 100}]]})

        # Test union with list of list of unions
        text = textwrap.dedent("""\
            namespace test

            union U
                a List(List(V))

                example default
                    a = [[default, special, x]]

            union V
                x
                y UInt64

                example default
                    x = null

                example special
                    y = 100
            """)
        t = TowerOfStone([('test.stone', text)])
        t.parse()
        u_dt = t.api.namespaces['test'].data_type_by_name['U']
        self.assertEqual(
            u_dt.get_examples()['default'].value,
            {'.tag': 'a', 'a': [[{'.tag': 'x'}, {'.tag': 'y', 'y': 100}, {'.tag': 'x'}]]})

    def test_examples_map(self):
        # valid simple example
        text = textwrap.dedent("""\
        namespace test

        struct S
            m Map(String, Int32)

            example default
                m = {"one": 1, "two": 2}
        """)

        t = TowerOfStone([('test.stone', text)])
        t.parse()
        s = t.api.namespaces['test'].data_type_by_name['S']
        self.assertIsInstance(s.get_examples()['default'].value, dict)

        # complex stone example
        text = textwrap.dedent("""\
            namespace test

            alias m = Map(String, Int32)
            alias mm = Map(String, m)

            struct S
                arg mm
                    "hash of hashes"

                example default
                    arg = {"key": {"one": 1}, "another_key" : {"two" : 2, "three": 3}}
        """)

        t = TowerOfStone([('test.stone', text)])
        t.parse()
        s = t.api.namespaces['test'].data_type_by_name['S']
        self.assertIsInstance(s.get_examples()['default'].value, dict)

        # map of structs
        text = textwrap.dedent("""\
            namespace test

            struct Substruct
                m2 Map(String, Int32)

                example example_ref
                    m2 = {"one": 1, "two": 2}

            struct S
                m Map(String, Substruct)

                example default
                    m = {"key": example_ref, "another_key": example_ref}
        """)

        t = TowerOfStone([('test.stone', text)])
        t.parse()
        s = t.api.namespaces['test'].data_type_by_name['S']
        self.assertIsInstance(s.get_examples()['default'].value, dict)

        # error when example doesn't match definition
        text = textwrap.dedent("""\
        namespace test

        struct S
            m Map(String, String)

            example default
                m = {"one": 1}
        """)

        t = TowerOfStone([('test.stone', text)])
        with self.assertRaises(InvalidSpec):
            t.parse()

    def test_name_conflicts(self):
        # Test name conflict in same file
        text = textwrap.dedent("""\
            namespace test

            struct S
                f String

            struct S
                g String
            """)
        t = TowerOfStone([('test.stone', text)])
        with self.assertRaises(InvalidSpec) as cm:
            t.parse()
        self.assertEqual(
            "Symbol 'S' already defined (test.stone:3).",
            cm.exception.msg)
        self.assertEqual(cm.exception.lineno, 6)

        # Test name conflict by route
        text = textwrap.dedent("""\
            namespace test

            struct S
                f String

            route S (Void, Void, Void)
            """)
        t = TowerOfStone([('test.stone', text)])
        with self.assertRaises(InvalidSpec) as cm:
            t.parse()
        self.assertEqual(
            "Symbol 'S' already defined (test.stone:3).",
            cm.exception.msg)
        self.assertEqual(cm.exception.lineno, 6)

        # Test name conflict by union
        text = textwrap.dedent("""\
            namespace test

            struct S
                f String

            union S
                g String
            """)
        t = TowerOfStone([('test.stone', text)])
        with self.assertRaises(InvalidSpec) as cm:
            t.parse()
        self.assertEqual(
            "Symbol 'S' already defined (test.stone:3).",
            cm.exception.msg)
        self.assertEqual(cm.exception.lineno, 6)

        # Test name conflict by alias
        text = textwrap.dedent("""\
            namespace test

            struct S
                f String

            alias S = UInt64
            """)
        t = TowerOfStone([('test.stone', text)])
        with self.assertRaises(InvalidSpec) as cm:
            t.parse()
        self.assertEqual(
            "Symbol 'S' already defined (test.stone:3).",
            cm.exception.msg)
        self.assertEqual(cm.exception.lineno, 6)

        # Test name from two specs that are part of the same namespace
        text1 = textwrap.dedent("""\
            namespace test

            struct S
                f String
            """)
        text2 = textwrap.dedent("""\
            namespace test


            struct S
                f String
            """)
        t = TowerOfStone([('test1.stone', text1), ('test2.stone', text2)])
        with self.assertRaises(InvalidSpec) as cm:
            t.parse()
        self.assertEqual(
            "Symbol 'S' already defined (test1.stone:3).",
            cm.exception.msg)
        self.assertEqual(cm.exception.lineno, 4)

    def test_imported_namespaces(self):
        text1 = textwrap.dedent("""\
            namespace ns1
            struct S1
                f1 String
            struct S2
                f2 String
            alias Iso8601 = Timestamp("%Y-%m-%dT%H:%M:%SZ")
            """)
        text2 = textwrap.dedent("""\
            namespace ns2
            import ns1
            struct S3
                f3 String
                f4 ns1.Iso8601?
                f5 ns1.S1?
                example default
                    f3 = "hello"
                    f4 = "2015-05-12T15:50:38Z"
            route r1(ns1.S1, ns1.S2, S3)
            """)
        t = TowerOfStone([('ns1.stone', text1), ('ns2.stone', text2)])
        t.parse()
        self.assertEqual(t.api.namespaces['ns2'].get_imported_namespaces(),
                         [t.api.namespaces['ns1']])
        xs = t.api.namespaces['ns2'].get_route_io_data_types()
        xs = sorted(xs, key=lambda x: x.name.lower())
        self.assertEqual(len(xs), 3)

        ns1 = t.api.namespaces['ns1']
        ns2 = t.api.namespaces['ns2']

        self.assertEqual(xs[0].namespace, ns1)
        self.assertEqual(xs[1].namespace, ns1)

        s3_dt = ns2.data_type_by_name['S3']
        self.assertEqual(s3_dt.fields[2].data_type.data_type.namespace, ns1)
        self.assertEqual(xs[2].name, 'S3')

    def test_namespace_obj(self):
        text = textwrap.dedent("""\
            namespace ns1
            struct S1
                f1 String
            struct S2
                f2 String
                s3 S3
            struct S3
                f3 String
            struct S4
                f4 String
            alias A = S2
            route r(S1, List(S4?)?, A)
            """)
        t = TowerOfStone([('ns1.stone', text)])
        t.parse()
        ns1 = t.api.namespaces['ns1']

        # Check that all data types are defined
        self.assertIn('S1', ns1.data_type_by_name)
        self.assertIn('S2', ns1.data_type_by_name)
        self.assertIn('S3', ns1.data_type_by_name)
        self.assertIn('S4', ns1.data_type_by_name)
        self.assertEqual(len(ns1.data_types), 4)

        # Check that route is defined
        self.assertIn('r', ns1.route_by_name)
        self.assertEqual(len(ns1.routes), 1)

        s1 = ns1.data_type_by_name['S1']
        a = ns1.alias_by_name['A']
        s3 = ns1.data_type_by_name['S3']
        s4 = ns1.data_type_by_name['S4']
        route_data_types = ns1.get_route_io_data_types()

        self.assertIn(s1, route_data_types)
        # Test that aliased reference is included
        self.assertIn(a, route_data_types)
        # Test that field type is not present
        self.assertNotIn(s3, route_data_types)
        # Check that type that is wrapped by a list and/or nullable is present
        self.assertIn(s4, route_data_types)

    def test_whitespace(self):
        text = textwrap.dedent("""\
            namespace test

            struct S
                f String
            ++++
                g Int64
            ++++
                example default
                    f = "hi"
            ++++++++
                    g = 3

            route r(Void, S, Void)
            """).replace('+', ' ')
        t = TowerOfStone([('ns1.stone', text)])
        t.parse()

        text = textwrap.dedent("""\
            namespace test

            struct S
                f String
            ++++
                g Int64
            ++++
                example default
                    f = "hi"
            ++++
            ++++++
                    g = 3

            route r(Void, S, Void)
            """).replace('+', ' ')
        t = TowerOfStone([('ns1.stone', text)])
        t.parse()

        text = textwrap.dedent("""\
            namespace test

                # weirdly indented comment
            struct S
               # weirdly indented comment
                f String
                g Int64

                example default
                    f = "hi"
                       # weirdly indented comment
                    g = 3

            route r(Void, S, Void)
            """)
        t = TowerOfStone([('ns1.stone', text)])
        t.parse()

    def test_route_attrs_schema(self):

        # Try to define route in stone_cfg
        stone_cfg_text = textwrap.dedent("""\
            namespace stone_cfg

            struct Route
                f1 String

            route r(Void, Void, Void)
            """)
        t = TowerOfStone([('stone_cfg.stone', stone_cfg_text)])
        with self.assertRaises(InvalidSpec) as cm:
            t.parse()
        self.assertEqual(
            'No routes can be defined in the stone_cfg namespace.',
            cm.exception.msg)
        self.assertEqual(cm.exception.lineno, 6)
        self.assertEqual(cm.exception.path, 'stone_cfg.stone')

        # Try to set bad type for schema
        stone_cfg_text = textwrap.dedent("""\
            namespace stone_cfg

            struct Route
                f1 String
            """)
        test_text = textwrap.dedent("""\
            namespace test
            route r1(Void, Void, Void)
                attrs
                    f1 = 3
            """)
        t = TowerOfStone([
            ('stone_cfg.stone', stone_cfg_text), ('test.stone', test_text)])
        with self.assertRaises(InvalidSpec) as cm:
            t.parse()
        self.assertEqual(
            'integer is not a valid string',
            cm.exception.msg)
        self.assertEqual(cm.exception.lineno, 4)
        self.assertEqual(cm.exception.path, 'test.stone')

        # Try missing attribute for route
        stone_cfg_text = textwrap.dedent("""\
            namespace stone_cfg

            struct Route
                f1 String
            """)
        test_text = textwrap.dedent("""\
            namespace test
            route r1(Void, Void, Void)
            """)
        t = TowerOfStone([
            ('stone_cfg.stone', stone_cfg_text), ('test.stone', test_text)])
        with self.assertRaises(InvalidSpec) as cm:
            t.parse()
        self.assertEqual(
            "Route does not define attr key 'f1'.",
            cm.exception.msg)
        self.assertEqual(cm.exception.lineno, 2)
        self.assertEqual(cm.exception.path, 'test.stone')

        # Test missing attribute for route attribute with default
        stone_cfg_text = textwrap.dedent("""\
            namespace stone_cfg

            struct Route
                f1 String = "yay"
            """)
        test_text = textwrap.dedent("""\
            namespace test
            route r1(Void, Void, Void)
            """)
        t = TowerOfStone([
            ('stone_cfg.stone', stone_cfg_text), ('test.stone', test_text)])
        t.parse()
        ns1 = t.api.namespaces['test']
        self.assertEquals(ns1.route_by_name['r1'].attrs['f1'], 'yay')

        # Test missing attribute for route attribute with optional
        stone_cfg_text = textwrap.dedent("""\
            namespace stone_cfg

            struct Route
                f1 String?
            """)
        test_text = textwrap.dedent("""\
            namespace test
            route r1(Void, Void, Void)
            """)
        t = TowerOfStone([
            ('stone_cfg.stone', stone_cfg_text), ('test.stone', test_text)])
        t.parse()
        test = t.api.namespaces['test']
        self.assertEquals(test.route_by_name['r1'].attrs['f1'], None)

        # Test unknown route attributes
        stone_cfg_text = textwrap.dedent("""\
            namespace stone_cfg

            struct Route
                f1 String?
            """)
        test_text = textwrap.dedent("""\
            namespace test
            route r1(Void, Void, Void)
                attrs
                    f2 = 3
            """)
        t = TowerOfStone([
            ('stone_cfg.stone', stone_cfg_text), ('test.stone', test_text)])
        with self.assertRaises(InvalidSpec) as cm:
            t.parse()
        self.assertEqual(
            "Route attribute 'f2' is not defined in 'stone_cfg.Route'.",
            cm.exception.msg)
        self.assertEqual(cm.exception.lineno, 4)
        self.assertEqual(cm.exception.path, 'test.stone')

        # Test no route attributes defined at all
        test_text = textwrap.dedent("""\
            namespace test
            route r1(Void, Void, Void)
                attrs
                    f1 = 3
            """)
        t = TowerOfStone([('test.stone', test_text)])
        with self.assertRaises(InvalidSpec) as cm:
            t.parse()
        self.assertEqual(
            "Route attribute 'f1' is not defined in 'stone_cfg.Route'.",
            cm.exception.msg)
        self.assertEqual(cm.exception.lineno, 4)
        self.assertEqual(cm.exception.path, 'test.stone')

        stone_cfg_text = textwrap.dedent("""\
            namespace stone_cfg

            struct Route
                f1 Boolean
                f2 Bytes
                f3 Float64
                f4 Int64
                f5 String
                f6 Timestamp("%Y-%m-%dT%H:%M:%SZ")
                f7 S
                f8 T
                f9 S?
                f10 T
                f11 S?

            alias S = String
            alias T = String?
            """)
        test_text = textwrap.dedent("""\
            namespace test
            route r1(Void, Void, Void)
                attrs
                    f1 = true
                    f2 = "asdf"
                    f3 = 3.2
                    f4 = 10
                    f5 = "Hello"
                    f6 = "2015-05-12T15:50:38Z"
                    f7 = "World"
                    f8 = "World"
                    f9 = "World"
            """)
        t = TowerOfStone([
            ('stone_cfg.stone', stone_cfg_text), ('test.stone', test_text)])
        t.parse()
        test = t.api.namespaces['test']
        attrs = test.route_by_name['r1'].attrs
        self.assertEquals(attrs['f1'], True)
        self.assertEquals(attrs['f2'], b'asdf')
        self.assertEquals(attrs['f3'], 3.2)
        self.assertEquals(attrs['f4'], 10)
        self.assertEquals(attrs['f5'], 'Hello')
        self.assertEquals(
            attrs['f6'], datetime.datetime(2015, 5, 12, 15, 50, 38))
        self.assertEquals(attrs['f7'], 'World')
        self.assertEquals(attrs['f8'], 'World')
        self.assertEquals(attrs['f9'], 'World')
        self.assertEquals(attrs['f10'], None)
        self.assertEquals(attrs['f11'], None)

        # Try defining an attribute twice.
        stone_cfg_text = textwrap.dedent("""\
            namespace stone_cfg

            import test

            struct Route
                f1 String
            """)
        test_text = textwrap.dedent("""\
            namespace test

            route r1(Void, Void, Void)
                attrs
                    f1 = "1"
                    f1 = "2"
            """)
        t = TowerOfStone([
            ('stone_cfg.stone', stone_cfg_text), ('test.stone', test_text)])
        with self.assertRaises(InvalidSpec) as cm:
            t.parse()
        self.assertEqual(
            "Attribute 'f1' defined more than once.",
            cm.exception.msg)
        self.assertEqual(cm.exception.lineno, 6)
        self.assertEqual(cm.exception.path, 'test.stone')

        # Test union type
        stone_cfg_text = textwrap.dedent("""\
            namespace stone_cfg

            import test

            struct Route
                f1 test.U
            """)
        test_text = textwrap.dedent("""\
            namespace test

            union U
                a
                b

            route r1(Void, Void, Void)
                attrs
                    f1 = a
            """)
        t = TowerOfStone([
            ('stone_cfg.stone', stone_cfg_text), ('test.stone', test_text)])
        t.parse()

        # Try union type with bad attribute
        stone_cfg_text = textwrap.dedent("""\
            namespace stone_cfg

            import test

            struct Route
                f1 test.U
            """)
        test_text = textwrap.dedent("""\
            namespace test

            union U
                a
                b

            route r1(Void, Void, Void)
                attrs
                    f1 = 3
            """)
        t = TowerOfStone([
            ('stone_cfg.stone', stone_cfg_text), ('test.stone', test_text)])
        with self.assertRaises(InvalidSpec) as cm:
            t.parse()
        self.assertEqual(
            "Expected union tag as value.",
            cm.exception.msg)
        self.assertEqual(cm.exception.lineno, 9)
        self.assertEqual(cm.exception.path, 'test.stone')

        # Try union type attribute with non-void tag set
        stone_cfg_text = textwrap.dedent("""\
            namespace stone_cfg

            import test

            struct Route
                f1 test.U
            """)
        test_text = textwrap.dedent("""\
            namespace test

            union U
                a
                b String

            route r1(Void, Void, Void)
                attrs
                    f1 = b
            """)
        t = TowerOfStone([
            ('stone_cfg.stone', stone_cfg_text), ('test.stone', test_text)])
        with self.assertRaises(InvalidSpec) as cm:
            t.parse()
        self.assertEqual(
            "invalid reference to non-void option 'b'",
            cm.exception.msg)
        self.assertEqual(cm.exception.lineno, 9)
        self.assertEqual(cm.exception.path, 'test.stone')

    def test_inline_type_def(self):
        text = textwrap.dedent("""\
            namespace test

            struct Photo

                dimensions Dimensions
                    "Dimensions for a photo."
                    struct
                        height UInt64
                            "Height of the photo."
                        width UInt64
                            "Width of the photo."

                        example default
                            height = 5
                            width = 10

                location GpsCoordinates?
                    struct
                        latitude Float64
                        longitude Float64

                        example default
                            latitude = 37.23
                            longitude = 122.2

                time_taken Int64
                    "The timestamp when the photo was taken."

                example default
                    "A typical photo"
                    dimensions = default
                    location = default
                    time_taken = 100


            union E
                e1
                e2 E2
                    "Test E2."
                    union
                        a
                        b

            route r(Void, Photo, E)
            """)
        t = TowerOfStone([('ns1.stone', text)])
        t.parse()

        text = textwrap.dedent("""\
            namespace test

            struct T
                g Int64

            struct S
                f T
                    "Dimensions for a photo or video."
                    struct
                        a String
                        b Int64
            """)
        t = TowerOfStone([('ns1.stone', text)])

        with self.assertRaises(InvalidSpec) as cm:
            t.parse()
        self.assertEqual(
            "Symbol 'T' already defined (ns1.stone:3).",
            cm.exception.msg)
        self.assertEqual(cm.exception.lineno, 9)
        self.assertEqual(cm.exception.path, 'ns1.stone')


if __name__ == '__main__':
    unittest.main()
