#!/usr/bin/env python

from __future__ import absolute_import, division, print_function, unicode_literals

import base64
import datetime
import json
import shutil
import six
import subprocess
import sys
import unittest

import stone.target.python_rsrc.stone_validators as bv

from stone.target.python_rsrc.stone_serializers import (
    json_encode,
    json_decode,
    _strftime as stone_strftime,
)


class TestDropInModules(unittest.TestCase):
    """
    Tests the stone_serializers and stone_validators modules.
    """

    def mk_validator_testers(self, validator):
        def p(i):
            validator.validate(i)

        def f(i):
            self.assertRaises(bv.ValidationError, validator.validate, i)

        return p, f  # 'p(input)' if you expect it to pass, 'f(input)' if you expect it to fail.

    def test_string_validator(self):
        s = bv.String(min_length=1, max_length=5, pattern='[A-z]+')
        # Not a string
        self.assertRaises(bv.ValidationError, lambda: s.validate(1))
        # Too short
        self.assertRaises(bv.ValidationError, lambda: s.validate(''))
        # Too long
        self.assertRaises(bv.ValidationError, lambda: s.validate('a' * 6))
        # Doesn't pass regex
        self.assertRaises(bv.ValidationError, lambda: s.validate('#'))
        # Passes
        s.validate('a')
        # Check that the validator is converting all strings to unicode
        self.assertEqual(type(s.validate('a')), six.text_type)

    def test_string_regex_anchoring(self):
        p, f = self.mk_validator_testers(bv.String(pattern=r'abc|xyz'))
        p('abc')
        p('xyz')
        f('_abc')
        f('abc_')
        f('_xyz')
        f('xyz_')

    def test_boolean_validator(self):
        b = bv.Boolean()
        b.validate(True)
        b.validate(False)
        self.assertRaises(bv.ValidationError, lambda: b.validate(1))

    def test_integer_validator(self):
        i = bv.UInt32(min_value=10, max_value=100)
        # Not an integer
        self.assertRaises(bv.ValidationError, lambda: i.validate(1.4))
        # Too small
        self.assertRaises(bv.ValidationError, lambda: i.validate(1))
        # Too large
        self.assertRaises(bv.ValidationError, lambda: i.validate(101))
        # Passes
        i.validate(50)

        # min_value is less than the default for the type
        self.assertRaises(AssertionError, lambda: bv.UInt32(min_value=-3))
        # non-sensical min_value
        self.assertRaises(AssertionError, lambda: bv.UInt32(min_value=1.3))

    def test_float_validator(self):
        f64 = bv.Float64()
        # Too large for a float to represent
        self.assertRaises(bv.ValidationError, lambda: f64.validate(10**310))
        # inf and nan should be rejected
        self.assertRaises(bv.ValidationError, lambda: f64.validate(float('nan')))
        self.assertRaises(bv.ValidationError, lambda: f64.validate(float('inf')))
        # Passes
        f64.validate(1.1 * 10**300)

        # Test a float64 with an additional bound
        f64b = bv.Float64(min_value=0, max_value=100)
        # Check bounds
        self.assertRaises(bv.ValidationError, lambda: f64b.validate(1000))
        self.assertRaises(bv.ValidationError, lambda: f64b.validate(-1))

        # Test a float64 with an invalid bound
        self.assertRaises(AssertionError, lambda: bv.Float64(min_value=0, max_value=10**330))

        f32 = bv.Float32()
        self.assertRaises(bv.ValidationError, lambda: f32.validate(3.5 * 10**38))
        self.assertRaises(bv.ValidationError, lambda: f32.validate(-3.5 * 10**38))
        # Passes
        f32.validate(0)

    def test_bytes_validator(self):
        b = bv.Bytes(min_length=1, max_length=10)
        # Not a valid binary type
        self.assertRaises(bv.ValidationError, lambda: b.validate(u'asdf'))
        # Too short
        self.assertRaises(bv.ValidationError, lambda: b.validate(b''))
        # Too long
        self.assertRaises(bv.ValidationError, lambda: b.validate(b'\x00' * 11))
        # Passes
        b.validate(b'\x00')

    def test_timestamp_validator(self):
        class UTC(datetime.tzinfo):
            def utcoffset(self, dt):  # pylint: disable=unused-argument,useless-suppression
                return datetime.timedelta(0)

            def tzname(self, dt):  # pylint: disable=unused-argument,useless-suppression
                return 'UTC'

            def dst(self, dt):  # pylint: disable=unused-argument,useless-suppression
                return datetime.timedelta(0)

        class PST(datetime.tzinfo):
            def utcoffset(self, dt):  # pylint: disable=unused-argument,useless-suppression
                return datetime.timedelta(-8)

            def tzname(self, dt):  # pylint: disable=unused-argument,useless-suppression
                return 'PST'

            def dst(self, dt):  # pylint: disable=unused-argument,useless-suppression
                return datetime.timedelta(0)

        t = bv.Timestamp('%a, %d %b %Y %H:%M:%S +0000')
        self.assertRaises(bv.ValidationError, lambda: t.validate('abcd'))
        now = datetime.datetime.utcnow()
        t.validate(now)
        then = datetime.datetime(1776, 7, 4, 12, 0, 0)
        t.validate(then)
        new_then = json_decode(t, json_encode(t, then))
        self.assertEqual(then, new_then)
        # Accept a tzinfo only if it's UTC
        t.validate(now.replace(tzinfo=UTC()))
        # Do not accept a non-UTC tzinfo
        self.assertRaises(bv.ValidationError,
                          lambda: t.validate(now.replace(tzinfo=PST())))

    def test_list_validator(self):
        l = bv.List(bv.String(), min_items=1, max_items=10)
        # Not a valid list type
        self.assertRaises(bv.ValidationError, lambda: l.validate('a'))
        # Too short
        self.assertRaises(bv.ValidationError, lambda: l.validate([]))
        # Too long
        self.assertRaises(bv.ValidationError, lambda: l.validate([1] * 11))
        # Not a valid string type
        self.assertRaises(bv.ValidationError, lambda: l.validate([1]))
        # Passes
        l.validate(['a'])

    def test_map_validator(self):
        m = bv.Map(bv.String(pattern="^foo.*"), bv.String(pattern=".*bar$"))

        # applies validators of children
        m.validate({"foo-one": "one-bar", "foo-two": "two-bar"})

        # does not match regex
        self.assertRaises(bv.ValidationError, lambda: m.validate({"one": "two"}))

        # does not match declared types
        self.assertRaises(bv.ValidationError, lambda: m.validate({1: 2}))

    def test_nullable_validator(self):
        n = bv.Nullable(bv.String())
        # Absent case
        n.validate(None)
        # Fails string validation
        self.assertRaises(bv.ValidationError, lambda: n.validate(123))
        # Passes
        n.validate('abc')
        # Stacking nullables isn't supported by our JSON wire format
        self.assertRaises(AssertionError,
                          lambda: bv.Nullable(bv.Nullable(bv.String())))
        self.assertRaises(AssertionError,
                          lambda: bv.Nullable(bv.Void()))

    def test_void_validator(self):
        v = bv.Void()
        # Passes: Only case that validates
        v.validate(None)
        # Fails validation
        self.assertRaises(bv.ValidationError, lambda: v.validate(123))

    def test_struct_validator(self):
        class C(object):
            _all_field_names_ = {'f'}
            _all_fields_ = [('f', bv.String())]
            f = None
        s = bv.Struct(C)
        self.assertRaises(bv.ValidationError, lambda: s.validate(object()))

    def test_json_encoder(self):
        self.assertEqual(json_encode(bv.Void(), None), json.dumps(None))
        self.assertEqual(json_encode(bv.String(), 'abc'), json.dumps('abc'))
        self.assertEqual(json_encode(bv.String(), u'\u2650'), json.dumps(u'\u2650'))
        self.assertEqual(json_encode(bv.UInt32(), 123), json.dumps(123))
        # Because a bool is a subclass of an int, ensure they aren't mistakenly
        # encoded as a true/false in JSON when an integer is the data type.
        self.assertEqual(json_encode(bv.UInt32(), True), json.dumps(1))
        self.assertEqual(json_encode(bv.Boolean(), True), json.dumps(True))
        f = '%a, %d %b %Y %H:%M:%S +0000'
        now = datetime.datetime.utcnow()
        self.assertEqual(json_encode(bv.Timestamp('%a, %d %b %Y %H:%M:%S +0000'), now),
                         json.dumps(now.strftime(f)))
        b = b'\xff' * 5
        self.assertEqual(json_encode(bv.Bytes(), b),
                         json.dumps(base64.b64encode(b).decode('ascii')))
        self.assertEqual(json_encode(bv.Nullable(bv.String()), None), json.dumps(None))
        self.assertEqual(json_encode(bv.Nullable(bv.String()), u'abc'), json.dumps('abc'))

    def test_json_encoder_union(self):
        # pylint: disable=attribute-defined-outside-init
        class S(object):
            _all_field_names_ = {'f'}
            _all_fields_ = [('f', bv.String())]

        class U(object):
            # pylint: disable=no-member
            _tagmap = {'a': bv.Int64(),
                       'b': bv.Void(),
                       'c': bv.Struct(S),
                       'd': bv.List(bv.Int64()),
                       'e': bv.Nullable(bv.Int64()),
                       'f': bv.Nullable(bv.Struct(S)),
                       'g': bv.Map(bv.String(), bv.String())}
            _tag = None

            def __init__(self, tag, value=None):
                self._tag = tag
                self._value = value

            def get_a(self):
                return self._a

            def get_c(self):
                return self._c

            def get_d(self):
                return self._d

        U.b = U('b')

        # Test primitive variant
        u = U('a', 64)
        self.assertEqual(json_encode(bv.Union(U), u, old_style=True),
                         json.dumps({'a': 64}))

        # Test symbol variant
        u = U('b')
        self.assertEqual(json_encode(bv.Union(U), u, old_style=True),
                         json.dumps('b'))

        # Test struct variant
        c = S()
        c.f = 'hello'
        c._f_present = True
        u = U('c', c)
        self.assertEqual(json_encode(bv.Union(U), u, old_style=True),
                         json.dumps({'c': {'f': 'hello'}}))

        # Test list variant
        u = U('d', [1, 2, 3, 'a'])
        # lists should be re-validated during serialization
        self.assertRaises(bv.ValidationError, lambda: json_encode(bv.Union(U), u))
        l = [1, 2, 3, 4]
        u = U('d', [1, 2, 3, 4])
        self.assertEqual(json_encode(bv.Union(U), u, old_style=True),
                         json.dumps({'d': l}))

        # Test a nullable union
        self.assertEqual(json_encode(bv.Nullable(bv.Union(U)), None),
                         json.dumps(None))
        self.assertEqual(json_encode(bv.Nullable(bv.Union(U)), u, old_style=True),
                         json.dumps({'d': l}))

        # Test nullable primitive variant
        u = U('e', None)
        self.assertEqual(json_encode(bv.Nullable(bv.Union(U)), u, old_style=True),
                         json.dumps('e'))
        u = U('e', 64)
        self.assertEqual(json_encode(bv.Nullable(bv.Union(U)), u, old_style=True),
                         json.dumps({'e': 64}))

        # Test nullable composite variant
        u = U('f', None)
        self.assertEqual(json_encode(bv.Nullable(bv.Union(U)), u, old_style=True),
                         json.dumps('f'))
        u = U('f', c)
        self.assertEqual(json_encode(bv.Nullable(bv.Union(U)), u, old_style=True),
                         json.dumps({'f': {'f': 'hello'}}))

        u = U('g', {'one': 2})
        self.assertRaises(bv.ValidationError, lambda: json_encode(bv.Union(U), u))

        m = {'one': 'two'}
        u = U('g', m)
        self.assertEqual(json_encode(bv.Union(U), u, old_style=True), json.dumps({'g': m}))

    def test_json_encoder_error_messages(self):
        # pylint: disable=attribute-defined-outside-init
        class S3(object):
            _all_field_names_ = {'j'}
            _all_fields_ = [('j', bv.UInt64(max_value=10))]

        class S2(object):
            _all_field_names_ = {'i'}
            _all_fields_ = [('i', bv.Struct(S3))]

        class S(object):
            _all_field_names_ = {'f'}
            _all_fields_ = [('f', bv.Struct(S2))]

        class U(object):
            # pylint: disable=no-member
            _tagmap = {'t': bv.Nullable(bv.Struct(S))}
            _tag = None
            _catch_all = None

            def __init__(self, tag, value=None):
                self._tag = tag
                self._value = value

            def get_t(self):
                return self._t

        s = S()
        s.f = S2()
        s._f_present = True
        s.f.i = S3()
        s.f._i_present = True
        s.f.i._j_present = False

        # Test that validation error references outer and inner struct
        with self.assertRaises(bv.ValidationError):
            try:
                json_encode(bv.Struct(S), s)
            except bv.ValidationError as e:
                prefix = 'f.i: '
                self.assertEqual(prefix, str(e)[:len(prefix)])
                raise

        u = U('t', s)

        # Test that validation error references outer union and inner structs
        with self.assertRaises(bv.ValidationError):
            try:
                json_encode(bv.Union(U), u)
            except bv.ValidationError as e:
                prefix = 't.f.i: '
                self.assertEqual(prefix, str(e)[:len(prefix)])
                raise

    def test_json_decoder(self):
        self.assertEqual(json_decode(bv.String(), json.dumps('abc')), 'abc')
        self.assertRaises(bv.ValidationError,
                          lambda: json_decode(bv.String(), json.dumps(32)))

        self.assertEqual(json_decode(bv.UInt32(), json.dumps(123)), 123)
        self.assertRaises(bv.ValidationError,
                          lambda: json_decode(bv.UInt32(), json.dumps('hello')))

        self.assertEqual(json_decode(bv.Boolean(), json.dumps(True)), True)
        self.assertRaises(bv.ValidationError,
                          lambda: json_decode(bv.Boolean(), json.dumps(1)))

        f = '%a, %d %b %Y %H:%M:%S +0000'
        now = datetime.datetime.utcnow().replace(microsecond=0)
        self.assertEqual(json_decode(bv.Timestamp('%a, %d %b %Y %H:%M:%S +0000'),
                                     json.dumps(now.strftime(f))),
                         now)
        # Try decoding timestamp with bad type
        self.assertRaises(bv.ValidationError,
                          lambda: json_decode(bv.Timestamp('%a, %d %b %Y %H:%M:%S +0000'), '1'))
        b = b'\xff' * 5
        self.assertEqual(json_decode(bv.Bytes(),
                                     json.dumps(base64.b64encode(b).decode('ascii'))),
                         b)
        self.assertRaises(bv.ValidationError,
                          lambda: json_decode(bv.Bytes(), json.dumps(1)))
        self.assertEqual(json_decode(bv.Nullable(bv.String()), json.dumps(None)), None)
        self.assertEqual(json_decode(bv.Nullable(bv.String()), json.dumps('abc')), 'abc')

        self.assertEqual(json_decode(bv.Void(), json.dumps(None)), None)
        # Check that void can take any input if strict is False.
        self.assertEqual(json_decode(bv.Void(), json.dumps(12345), strict=False), None)
        # Check that an error is raised if strict is True and there's a non-null value
        self.assertRaises(bv.ValidationError,
                          lambda: json_decode(bv.Void(), json.dumps(12345), strict=True))

    def test_json_decoder_struct(self):
        class S(object):
            _all_field_names_ = {'f', 'g'}
            _all_fields_ = [('f', bv.String()),
                            ('g', bv.Nullable(bv.String()))]
            _g = None

            @property
            def f(self):
                return self._f

            @f.setter
            def f(self, val):
                self._f = val  # pylint: disable=attribute-defined-outside-init

            @property
            def g(self):
                return self._g

            @g.setter
            def g(self, val):
                self._g = val

        # Required struct fields must be present
        self.assertRaises(bv.ValidationError,
                          lambda: json_decode(bv.Struct(S), json.dumps({})))
        json_decode(bv.Struct(S), json.dumps({'f': 't'}))

        # Struct fields can have null values for nullable fields
        msg = json.dumps({'f': 't', 'g': None})
        json_decode(bv.Struct(S), msg)

        # Unknown struct fields raise error if strict
        msg = json.dumps({'f': 't', 'z': 123})
        self.assertRaises(bv.ValidationError,
                          lambda: json_decode(bv.Struct(S), msg, strict=True))
        json_decode(bv.Struct(S), msg, strict=False)

    def test_json_decoder_union(self):
        class S(object):
            _all_field_names_ = {'f'}
            _all_fields_ = [('f', bv.String())]

        class U(object):
            _tagmap = {'a': bv.Int64(),
                       'b': bv.Void(),
                       'c': bv.Struct(S),
                       'd': bv.List(bv.Int64()),
                       'e': bv.Nullable(bv.Int64()),
                       'f': bv.Nullable(bv.Struct(S)),
                       'g': bv.Void(),
                       'h': bv.Map(bv.String(), bv.String())}
            _catch_all = 'g'
            _tag = None

            def __init__(self, tag, value=None):
                self._tag = tag
                self._value = value

            def get_a(self):
                return self._value

            def get_c(self):
                return self._value

            def get_d(self):
                return self._value

        U.b = U('b')

        # TODO: When run with Python 3, pylint thinks `u` is a `datetime`
        # object. This results in spurious `no-member` errors, which we
        # choose to ignore here (for now). This does not happen when
        # running pylint with Python 2 (hence the useless-suppression).
        # pylint: disable=no-member,useless-suppression

        # Test primitive variant
        u = json_decode(bv.Union(U), json.dumps({'a': 64}), old_style=True)
        self.assertEqual(u.get_a(), 64)

        # Test void variant
        u = json_decode(bv.Union(U), json.dumps('b'))
        self.assertEqual(u._tag, 'b')
        self.assertRaises(bv.ValidationError,
                          lambda: json_decode(bv.Union(U), json.dumps({'b': [1, 2]})))
        u = json_decode(bv.Union(U), json.dumps({'b': [1, 2]}), strict=False, old_style=True)
        self.assertEqual(u._tag, 'b')

        # Test struct variant
        u = json_decode(bv.Union(U), json.dumps({'c': {'f': 'hello'}}), old_style=True)
        self.assertEqual(u.get_c().f, 'hello')
        self.assertRaises(bv.ValidationError,
                          lambda: json_decode(bv.Union(U), json.dumps({'c': [1, 2, 3]})))

        # Test list variant
        l = [1, 2, 3, 4]
        u = json_decode(bv.Union(U), json.dumps({'d': l}), old_style=True)
        self.assertEqual(u.get_d(), l)

        # Test map variant
        m = {'one': 'two', 'three': 'four'}
        u = json_decode(bv.Union(U), json.dumps({'h': m}), old_style=True)
        self.assertEqual(u.get_d(), m)

        # Raises if unknown tag
        self.assertRaises(bv.ValidationError, lambda: json_decode(bv.Union(U), json.dumps('z')))

        # Unknown variant (strict=True)
        self.assertRaises(bv.ValidationError,
                          lambda: json_decode(bv.Union(U), json.dumps({'z': 'test'})))

        # Test catch all variant
        u = json_decode(bv.Union(U), json.dumps({'z': 'test'}),
                        strict=False, old_style=True)
        self.assertEqual(u._tag, 'g')

        # Test nullable union
        u = json_decode(bv.Nullable(bv.Union(U)), json.dumps(None),
                        strict=False, old_style=True)
        self.assertEqual(u, None)

        # Test nullable union member
        u = json_decode(bv.Union(U), json.dumps('e'))
        self.assertEqual(u._tag, 'e')
        self.assertEqual(u._value, None)
        u = json_decode(bv.Union(U), json.dumps({'e': 64}),
                        strict=False, old_style=True)
        self.assertEqual(u._tag, 'e')
        self.assertEqual(u._value, 64)

        # Test nullable composite variant
        u = json_decode(bv.Union(U), json.dumps('f'))
        self.assertEqual(u._tag, 'f')
        u = json_decode(bv.Union(U), json.dumps({'f': {'f': 'hello'}}),
                        strict=False, old_style=True)
        self.assertEqual(type(u._value), S)
        self.assertEqual(u._value.f, 'hello')

    def test_json_decoder_error_messages(self):
        class S3(object):
            _all_field_names_ = {'j'}
            _all_fields_ = [('j', bv.UInt64(max_value=10))]

        class S2(object):
            _all_field_names_ = {'i'}
            _all_fields_ = [('i', bv.Struct(S3))]

        class S(object):
            _all_field_names_ = {'f'}
            _all_fields_ = [('f', bv.Struct(S2))]

        class U(object):
            _tagmap = {'t': bv.Nullable(bv.Struct(S))}
            _tag = None
            _catch_all = None

            def __init__(self, tag, value=None):
                self._tag = tag
                self._value = value

            def get_t(self):
                return self._value

        # Test that validation error references outer and inner struct
        with self.assertRaises(bv.ValidationError):
            try:
                json_decode(bv.Struct(S), json.dumps({'f': {'i': {}}}), strict=False)
            except bv.ValidationError as e:
                prefix = 'f.i: '
                self.assertEqual(prefix, str(e)[:len(prefix)])
                raise

        # Test that validation error references outer union and inner structs
        with self.assertRaises(bv.ValidationError):
            try:
                json_decode(bv.Union(U), json.dumps({'t': {'f': {'i': {}}}}),
                            strict=False, old_style=True)
            except bv.ValidationError as e:
                prefix = 't.f.i: '
                self.assertEqual(prefix, str(e)[:len(prefix)])
                raise


test_spec = """\
namespace ns

import ns2

struct A
    "Sample struct doc."
    a String
        "Sample field doc."
    b Int64

struct B extends A
    c Bytes

struct C extends B
    d Float64

struct D
    a String
    b UInt64 = 10
    c String?
    d List(Int64?)
    e Map(String, String?)

struct E
    a String = "test"
    b UInt64 = 10
    c Int64?

struct DocTest
    b Boolean
        "If :val:`true` then..."
    t String
        "References :type:`D`."

union_closed U
    "Sample union doc."
    t0
        "Sample field doc."
    t1 String
    t2

union UOpen extends U
    t3

union_closed UExtend extends U
    t3

union_closed UExtend2 extends U
    t3

union_closed UExtendExtend extends UExtend
    t4

union V
    t0
    t1 String
    t2 String?
    t3 S
    t4 S?
    t5 U
    t6 U?
    t7 Resource
    t8 Resource?
    t9 List(String)
    t10 List(U)
    t11 Map(String, Int32)
    t12 Map(String, U)

struct S
    f String

struct Resource
    union_closed
        file File
        folder Folder

    name String

struct File extends Resource
    size UInt64

struct Folder extends Resource
    "Regular folder"

# Differs from Resource because it's a catch-all
struct ResourceLax
    union
        file File2
        folder Folder2

    name String

struct File2 extends ResourceLax
    size UInt64

struct Folder2 extends ResourceLax
    "Regular folder"

struct ImportTestS extends ns2.BaseS
    a String

union_closed ImportTestU extends ns2.BaseU
    a UInt64

union_closed U2
    a
    b OptionalS

struct OptionalS
    f1 String = "hello"
    f2 UInt64 = 3

struct S2
    f1 OptionalS

alias AliasedS2 = S2
alias AliasedString = String(max_length=10)

struct ContainsAlias
    s AliasedString

struct S3
    u ns2.BaseU = z
"""

test_ns2_spec = """\
namespace ns2

struct BaseS
    "This is a test \u2650"
    z Int64

union_closed BaseU
    z
    x String

alias AliasedBaseU = BaseU
"""


class TestGeneratedPython(unittest.TestCase):

    def setUp(self):

        # Sanity check: stone must be importable for the compiler to work
        __import__('stone')

        # Compile spec by calling out to stone
        p = subprocess.Popen(
            [sys.executable,
             '-m',
             'stone.cli',
             'python_types',
             'output',
             '-'],
            stdin=subprocess.PIPE,
            stderr=subprocess.PIPE)
        _, stderr = p.communicate(
            input=(test_spec + test_ns2_spec).encode('utf-8'))
        if p.wait() != 0:
            raise AssertionError('Could not execute stone tool: %s' %
                                 stderr.decode('utf-8'))

        sys.path.append('output')
        self.ns2 = __import__('ns2')
        self.ns = __import__('ns')
        self.sv = __import__('stone_validators')
        self.ss = __import__('stone_serializers')
        self.encode = self.ss.json_encode
        self.compat_obj_encode = self.ss.json_compat_obj_encode
        self.decode = self.ss.json_decode
        self.compat_obj_decode = self.ss.json_compat_obj_decode

    def test_docstring(self):
        # Check that the docstrings from the spec have in some form made it
        # into the Python docstrings for the generated objects.
        self.assertIn('Sample struct doc.', self.ns.A.__doc__)
        self.assertIn('Sample field doc.', self.ns.A.a.__doc__)
        self.assertIn('Sample union doc.', self.ns.U.__doc__)
        self.assertIn('Sample field doc.', self.ns.U.t0.__doc__)

        # Test doc conversion of Python bool.
        self.assertIn('``True``', self.ns.DocTest.b.__doc__)
        # Test doc converts type reference to sphinx-friendly representation.
        self.assertIn(':class:`D`', self.ns.DocTest.t.__doc__)

    def test_aliases(self):
        # The left is a validator, the right is the struct devs can use...
        self.assertEqual(self.ns.AliasedS2, self.ns.S2)

    def test_struct_decoding(self):
        d = self.decode(self.sv.Struct(self.ns.D),
                        json.dumps({'a': 'A', 'b': 1, 'c': 'C', 'd': [], 'e': {}}))
        self.assertIsInstance(d, self.ns.D)
        self.assertEqual(d.a, 'A')
        self.assertEqual(d.b, 1)
        self.assertEqual(d.c, 'C')
        self.assertEqual(d.d, [])
        self.assertEqual(d.e, {})

        # Test with missing value for nullable field
        d = self.decode(self.sv.Struct(self.ns.D),
                        json.dumps({'a': 'A', 'b': 1, 'd': [], 'e': {}}))
        self.assertEqual(d.a, 'A')
        self.assertEqual(d.b, 1)
        self.assertEqual(d.c, None)
        self.assertEqual(d.d, [])
        self.assertEqual(d.e, {})

        # Test with missing value for field with default
        d = self.decode(self.sv.Struct(self.ns.D),
                        json.dumps({'a': 'A', 'c': 'C', 'd': [1], 'e': {'one': 'two'}}))
        self.assertEqual(d.a, 'A')
        self.assertEqual(d.b, 10)
        self.assertEqual(d.c, 'C')
        self.assertEqual(d.d, [1])
        self.assertEqual(d.e, {'one': 'two'})

        # Test with explicitly null value for nullable field
        d = self.decode(self.sv.Struct(self.ns.D),
                        json.dumps({'a': 'A', 'c': None, 'd': [1, 2], 'e': {'one': 'two'}}))
        self.assertEqual(d.a, 'A')
        self.assertEqual(d.c, None)
        self.assertEqual(d.d, [1, 2])
        self.assertEqual(d.e, {'one': 'two'})

        # Test with None and numbers in list
        d = self.decode(self.sv.Struct(self.ns.D),
                        json.dumps({'a': 'A',
                                    'c': None,
                                    'd': [None, 1],
                                    'e': {'one': None, 'two': 'three'}}))
        self.assertEqual(d.a, 'A')
        self.assertEqual(d.c, None)
        self.assertEqual(d.d, [None, 1])
        self.assertEqual(d.e, {'one': None, 'two': 'three'})

        # Test with explicitly null value for field with default
        with self.assertRaises(self.sv.ValidationError) as cm:
            self.decode(self.sv.Struct(self.ns.D),
                        json.dumps({'a': 'A', 'b': None}))
        self.assertEqual("b: expected integer, got null", str(cm.exception))

    def test_union_decoding_old(self):
        v = self.decode(self.sv.Union(self.ns.V), json.dumps('t0'))
        self.assertIsInstance(v, self.ns.V)

        # Test verbose representation of a void union member
        v = self.decode(self.sv.Union(self.ns.V), json.dumps({'t0': None}), old_style=True)
        self.assertIsInstance(v, self.ns.V)

        # Test bad value for void union member
        with self.assertRaises(self.sv.ValidationError) as cm:
            self.decode(self.sv.Union(self.ns.V), json.dumps({'t0': 10}), old_style=True)
        self.assertEqual("expected null, got integer", str(cm.exception))

        # Test compact representation of a nullable union member with missing value
        v = self.decode(self.sv.Union(self.ns.V), json.dumps('t2'))
        self.assertIsInstance(v, self.ns.V)

        # Test verbose representation of a nullable union member with missing value
        v = self.decode(self.sv.Union(self.ns.V), json.dumps({'t2': None}), old_style=True)
        self.assertIsInstance(v, self.ns.V)

        # Test verbose representation of a nullable union member with bad value
        with self.assertRaises(self.sv.ValidationError) as cm:
            self.decode(self.sv.Union(self.ns.V), json.dumps({'t2': 123}), old_style=True)
        self.assertEqual("'123' expected to be a string, got integer", str(cm.exception))

    def test_union_decoding(self):
        v = self.decode(self.sv.Union(self.ns.V), json.dumps('t0'))
        self.assertIsInstance(v, self.ns.V)
        self.assertTrue(v.is_t0())

        # Test verbose representation of a void union member
        v = self.decode(self.sv.Union(self.ns.V), json.dumps({'.tag': 't0'}))
        self.assertIsInstance(v, self.ns.V)
        self.assertTrue(v.is_t0())

        # Test extra verbose representation of a void union member
        v = self.decode(self.sv.Union(self.ns.V), json.dumps({'.tag': 't0', 't0': None}))
        self.assertIsInstance(v, self.ns.V)
        self.assertTrue(v.is_t0())

        # Test error: extra key
        with self.assertRaises(self.sv.ValidationError) as cm:
            v = self.decode(self.sv.Union(self.ns.V), json.dumps({'.tag': 't0', 'unk': 123}))
        self.assertEqual("unexpected key 'unk'", str(cm.exception))

        # Test error: bad type
        with self.assertRaises(self.sv.ValidationError) as cm:
            v = self.decode(self.sv.Union(self.ns.V), json.dumps({'.tag': 123}))
        self.assertEqual('tag must be string, got integer', str(cm.exception))

        # Test primitive union member
        v = self.decode(self.sv.Union(self.ns.V), json.dumps({'.tag': 't1', 't1': 'hello'}))
        self.assertIsInstance(v, self.ns.V)
        self.assertTrue(v.is_t1())
        self.assertEqual(v.get_t1(), 'hello')

        # Test catch-all
        v = self.decode(
            self.sv.Union(self.ns.V),
            json.dumps({'.tag': 'z', 'z': 'hello'}),
            strict=False)
        self.assertIsInstance(v, self.ns.V)
        self.assertTrue(v.is_other())

        # Test catch-all is reject if strict
        with self.assertRaises(self.sv.ValidationError):
            self.decode(self.sv.Union(self.ns.V), json.dumps({'.tag': 'z'}))

        # Test explicitly using catch-all is reject if strict
        with self.assertRaises(self.sv.ValidationError):
            self.decode(self.sv.Union(self.ns.V), json.dumps({'.tag': 'other'}))

        # Test nullable primitive union member with null value
        v = self.decode(self.sv.Union(self.ns.V), json.dumps({'.tag': 't2', 't2': None}))
        self.assertIsInstance(v, self.ns.V)
        self.assertTrue(v.is_t2())
        self.assertEqual(v.get_t2(), None)

        # Test nullable primitive union member that is missing
        v = self.decode(self.sv.Union(self.ns.V), json.dumps({'.tag': 't2'}))
        self.assertIsInstance(v, self.ns.V)
        self.assertTrue(v.is_t2())
        self.assertEqual(v.get_t2(), None)

        # Test error: extra key
        with self.assertRaises(self.sv.ValidationError) as cm:
            self.decode(self.sv.Union(self.ns.V),
                        json.dumps({'.tag': 't2', 't2': None, 'unk': 123}))
        self.assertEqual("unexpected key 'unk'", str(cm.exception))

        # Test composite union member
        v = self.decode(self.sv.Union(self.ns.V), json.dumps({'.tag': 't3', 'f': 'hello'}))
        self.assertIsInstance(v, self.ns.V)
        self.assertTrue(v.is_t3())
        self.assertIsInstance(v.get_t3(), self.ns.S)
        self.assertEqual(v.get_t3().f, 'hello')

        # Test error: extra key
        with self.assertRaises(self.sv.ValidationError) as cm:
            self.decode(self.sv.Union(self.ns.V),
                        json.dumps({'.tag': 't3', 'f': 'hello', 'g': 'blah'}))
        self.assertEqual("t3: unknown field 'g'", str(cm.exception))

        # Test composite union member with unknown key, but strict is False
        v = self.decode(self.sv.Union(self.ns.V),
                        json.dumps({'.tag': 't3', 'f': 'hello', 'g': 'blah'}),
                        strict=False)
        self.assertIsInstance(v, self.ns.V)
        self.assertTrue(v.is_t3())
        self.assertIsInstance(v.get_t3(), self.ns.S)
        self.assertEqual(v.get_t3().f, 'hello')

        # Test nullable composite union member
        v = self.decode(self.sv.Union(self.ns.V), json.dumps({'.tag': 't4', 'f': 'hello'}))
        self.assertIsInstance(v, self.ns.V)
        self.assertTrue(v.is_t4())
        self.assertIsInstance(v.get_t4(), self.ns.S)
        self.assertEqual(v.get_t4().f, 'hello')

        # Test nullable composite union member that's null
        v = self.decode(self.sv.Union(self.ns.V), json.dumps({'.tag': 't4'}))
        self.assertIsInstance(v, self.ns.V)
        self.assertTrue(v.is_t4())
        self.assertIsNone(v.get_t4())

        # Test stacked unions
        v = self.decode(
            self.sv.Union(self.ns.V),
            json.dumps({'.tag': 't5', 't5': {'.tag': 't1', 't1': 'hello'}}))
        self.assertIsInstance(v, self.ns.V)
        self.assertTrue(v.is_t5(), None)
        self.assertIsInstance(v.get_t5(), self.ns.U)
        u = v.get_t5()
        self.assertEqual(u.get_t1(), 'hello')

        # Test stacked unions with null
        v = self.decode(
            self.sv.Union(self.ns.V),
            json.dumps({'.tag': 't6'}))
        self.assertIsInstance(v, self.ns.V)
        self.assertTrue(v.is_t6(), None)
        self.assertEqual(v.get_t6(), None)

        # Test member that enumerates subtypes
        v = self.decode(
            self.sv.Union(self.ns.V),
            json.dumps({'.tag': 't7', 't7': {'.tag': 'file', 'name': 'test', 'size': 1024}}))
        self.assertIsInstance(v, self.ns.V)
        self.assertIsInstance(v.get_t7(), self.ns.File)
        f = v.get_t7()
        self.assertEqual(f.name, 'test')
        self.assertEqual(f.size, 1024)

        # Test member that enumerates subtypes with null
        v = self.decode(
            self.sv.Union(self.ns.V),
            json.dumps({'.tag': 't8'}))
        self.assertIsInstance(v, self.ns.V)
        self.assertEqual(v.get_t8(), None)

        # Test member that is a list
        v = self.decode(
            self.sv.Union(self.ns.V),
            json.dumps({'.tag': 't9', 't9': ['a', 'b']}))
        self.assertIsInstance(v, self.ns.V)
        self.assertEqual(v.get_t9(), ['a', 'b'])

        # Test member that is a list of composites
        v = self.decode(
            self.sv.Union(self.ns.V),
            json.dumps({'.tag': 't10', 't10': [{'.tag': 't1', 't1': 'hello'}]}))
        self.assertIsInstance(v, self.ns.V)
        t10 = v.get_t10()
        self.assertEqual(t10[0].get_t1(), 'hello')

        # Test member that is a list of composites (old style)
        v = self.decode(
            self.sv.Union(self.ns.V),
            json.dumps({'t10': [{'t1': 'hello'}]}),
            old_style=True)
        self.assertIsInstance(v, self.ns.V)
        t10 = v.get_t10()
        self.assertEqual(t10[0].get_t1(), 'hello')

        # Test member that has evolved from void to type in non-strict mode.
        v = self.decode(
            self.sv.Union(self.ns.V),
            json.dumps({'.tag': 't0', 't0': "hello"}),
            strict=False)
        self.assertIsInstance(v, self.ns.V)
        self.assertTrue(v.is_t0())

        # test maps
        v = self.decode(
            self.sv.Union(self.ns.V),
            json.dumps({'.tag': 't11', 't11': {'a': 100}}))
        self.assertIsInstance(v, self.ns.V)
        self.assertEqual(v.get_t11(), {'a': 100})

        # Test map of composites:
        # Test member that is a list of composites
        v = self.decode(
            self.sv.Union(self.ns.V),
            json.dumps({'.tag': 't12', 't12': {'key': {'.tag': 't1', 't1': 'hello'}}}))
        self.assertIsInstance(v, self.ns.V)
        t12 = v.get_t12()
        self.assertEqual(t12['key'].get_t1(), 'hello')

        # Test member that is a list of composites (old style)
        v = self.decode(
            self.sv.Union(self.ns.V),
            json.dumps({'t12': {'another key': {'t1': 'hello again'}}}),
            old_style=True)
        self.assertIsInstance(v, self.ns.V)
        t12 = v.get_t12()
        self.assertEqual(t12['another key'].get_t1(), 'hello again')

    def test_union_decoding_with_optional_struct(self):
        # Simulate that U2 used to have a field b with no value, but it's since
        # been evolved to a field with an optional struct (only has optional
        # fields).
        u2 = self.decode(
            self.sv.Union(self.ns.U2),
            json.dumps({'.tag': 'b'}))
        self.assertIsInstance(u2, self.ns.U2)
        b = u2.get_b()
        self.assertIsInstance(b, self.ns.OptionalS)
        self.assertEqual(b.f1, 'hello')
        self.assertEqual(b.f2, 3)

    def test_union_equality_with_object(self):
        """Should not throw an error when comparing with object.

        Object is a superclass of Union, but it should not be considered for equality.
        """
        u = self.decode(self.sv.Union(self.ns.U), json.dumps({'.tag': 't0'}))
        self.assertFalse(u == object())

    def test_union_equality_with_tag(self):
        u = self.decode(self.sv.Union(self.ns.U), json.dumps({'.tag': 't0'}))
        u_equal = self.decode(self.sv.Union(self.ns.U), json.dumps({'.tag': 't0'}))
        u_unequal = self.decode(self.sv.Union(self.ns.U), json.dumps({'.tag': 't2'}))
        self.assertEqual(u, u_equal)
        self.assertEqual(hash(u), hash(u_equal))
        self.assertNotEqual(u, u_unequal)
        self.assertNotEqual(hash(u), hash(u_unequal))

    def test_union_equality_with_value(self):
        u = self.decode(self.sv.Union(self.ns.U), json.dumps({'.tag': 't1', 't1': 'a'}))
        u_equal = self.decode(self.sv.Union(self.ns.U), json.dumps({'.tag': 't1', 't1': 'a'}))
        u_unequal = self.decode(self.sv.Union(self.ns.U), json.dumps({'.tag': 't1', 't1': 'b'}))
        self.assertEqual(u, u_equal)
        self.assertEqual(hash(u), hash(u_equal))
        self.assertNotEqual(u, u_unequal)
        self.assertNotEqual(hash(u), hash(u_unequal))

    def test_union_equality_with_closed_and_open(self):
        """A closed union should be considered equal to an open union if they have a direct
        inheritance relationship."""
        u = self.decode(self.sv.Union(self.ns.U), json.dumps({'.tag': 't0'}))
        u_open = self.decode(self.sv.Union(self.ns.UOpen), json.dumps({'.tag': 't0'}))
        self.assertEqual(u, u_open)
        self.assertEqual(hash(u), hash(u_open))

    def test_union_equality_with_different_types(self):
        """Unions of different types that do not have an inheritance relationship are not considered
        equal to each other."""
        u = self.decode(self.sv.Union(self.ns.U), json.dumps({'.tag': 't0'}))
        v = self.decode(self.sv.Union(self.ns.V), json.dumps({'.tag': 't0'}))
        self.assertNotEqual(u, v)
        # They still hash to the same value, since they have the same tag and value, but this is
        # fine since we don't expect to use a large number of unions as dict keys.
        self.assertEqual(hash(u), hash(v))

        # U_extend and U_extend2 are indirectly related because they both extend U, but they do not
        # have a direct line of inheritance to each other.
        u_extend = self.decode(self.sv.Union(self.ns.UExtend), json.dumps({'.tag': 't0'}))
        u_extend2 = self.decode(self.sv.Union(self.ns.UExtend2), json.dumps({'.tag': 't0'}))
        self.assertNotEqual(u_extend, u_extend2)
        # They still hash to the same value, since they have the same tag and value, but this is
        # fine since we don't expect to use a large number of unions as dict keys.
        self.assertEqual(hash(u_extend), hash(u_extend2))

    def test_extended_union_equality(self):
        """Unions which subclass each other are considered equal to each other."""
        u = self.decode(self.sv.Union(self.ns.U), json.dumps({'.tag': 't0'}))
        u_extend = self.decode(self.sv.Union(self.ns.UExtend), json.dumps({'.tag': 't0'}))
        u_extend_extend = self.decode(self.sv.Union(self.ns.UExtendExtend),
                                      json.dumps({'.tag': 't0'}))
        self.assertEqual(u, u_extend)
        self.assertEqual(hash(u), hash(u_extend))
        self.assertEqual(u, u_extend_extend)
        self.assertEqual(hash(u), hash(u_extend_extend))
        self.assertEqual(u_extend, u_extend_extend)
        self.assertEqual(hash(u_extend), hash(u_extend_extend))

    def test_struct_decoding_with_optional_struct(self):
        opt_s = self.decode(
            self.sv.Struct(self.ns.OptionalS),
            json.dumps(None))
        self.assertEqual(opt_s.f1, 'hello')
        self.assertEqual(opt_s.f2, 3)

        # Simulate that S2 used to have no fields, but now it has a new field
        # that is an optional struct (only has optional fields).
        s2 = self.decode(
            self.sv.Struct(self.ns.S2),
            json.dumps({}))
        self.assertIsInstance(s2, self.ns.S2)
        self.assertIsInstance(s2.f1, self.ns.OptionalS)
        self.assertEqual(s2.f1.f1, 'hello')
        self.assertEqual(s2.f1.f2, 3)

    def test_union_encoding(self):
        # Test void union member
        v_t0 = self.ns.V.t0
        self.assertEqual(self.compat_obj_encode(self.sv.Union(self.ns.V), v_t0),
                         {'.tag': 't0'})

        # Test that the .tag key comes first
        v = self.compat_obj_encode(self.sv.Union(self.ns.V), v_t0)
        self.assertEqual(list(v.keys())[0], '.tag')

        # Test primitive union member
        v_t1 = self.ns.V.t1('hello')
        self.assertEqual(self.compat_obj_encode(self.sv.Union(self.ns.V), v_t1),
                         {'.tag': 't1', 't1': 'hello'})

        # Test nullable primitive union member
        v_t2 = self.ns.V.t2('hello')
        self.assertEqual(self.compat_obj_encode(self.sv.Union(self.ns.V), v_t2),
                         {'.tag': 't2', 't2': 'hello'})

        # Test nullable primitive union member that's null
        v_t2 = self.ns.V.t2(None)
        self.assertEqual(self.compat_obj_encode(self.sv.Union(self.ns.V), v_t2),
                         {'.tag': 't2'})

        # Test composite union member
        s = self.ns.S(f='hello')
        v_t3 = self.ns.V.t3(s)
        self.assertEqual(self.compat_obj_encode(self.sv.Union(self.ns.V), v_t3),
                         {'.tag': 't3', 'f': 'hello'})

        # Test nullable composite union member
        s = self.ns.S(f='hello')
        v_t4 = self.ns.V.t4(s)
        self.assertEqual(self.compat_obj_encode(self.sv.Union(self.ns.V), v_t4),
                         {'.tag': 't4', 'f': 'hello'})

        # Test nullable composite union member that's null
        v_t4 = self.ns.V.t4(None)
        self.assertEqual(self.compat_obj_encode(self.sv.Union(self.ns.V), v_t4),
                         {'.tag': 't4'})

        # Test stacked unions
        v_t5 = self.ns.V.t5(self.ns.U.t1('hello'))
        self.assertEqual(self.compat_obj_encode(self.sv.Union(self.ns.V), v_t5),
                         {'.tag': 't5', 't5': {'.tag': 't1', 't1': 'hello'}})

        # Test stacked unions with null
        v_t6 = self.ns.V.t6(None)
        self.assertEqual(self.compat_obj_encode(self.sv.Union(self.ns.V), v_t6),
                         {'.tag': 't6'})

        # Test member that enumerates subtypes
        v_t7 = self.ns.V.t7(self.ns.File(name='test', size=1024))
        self.assertEqual(
            self.compat_obj_encode(self.sv.Union(self.ns.V), v_t7),
            {'.tag': 't7', 't7': {'.tag': 'file', 'name': 'test', 'size': 1024}})

        # Test member that enumerates subtypes but is null
        v_t8 = self.ns.V.t8(None)
        self.assertEqual(
            self.compat_obj_encode(self.sv.Union(self.ns.V), v_t8),
            {'.tag': 't8'})

        # Test member that is a list
        v_t9 = self.ns.V.t9(['a', 'b'])
        self.assertEqual(
            self.compat_obj_encode(self.sv.Union(self.ns.V), v_t9),
            {'.tag': 't9', 't9': ['a', 'b']})

        # Test member that is a map
        v_t11 = self.ns.V.t11({'a_key': 404})
        self.assertEqual(
            self.compat_obj_encode(self.sv.Union(self.ns.V), v_t11),
            {'.tag': 't11', 't11': {'a_key': 404}}
        )

    def test_list_coding(self):
        # Test decoding list of composites
        v = self.decode(
            self.sv.List(self.sv.Struct(self.ns.S)),
            json.dumps([{'f': 'Test'}]))
        self.assertIsInstance(v, list)
        self.assertIsInstance(v[0], self.ns.S)
        self.assertEqual(v[0].f, 'Test')

        # Test encoding list of composites
        v = self.encode(
            self.sv.List(self.sv.Struct(self.ns.S)),
            [self.ns.S('Test')])
        self.assertEqual(v, json.dumps([{'f': 'Test'}]))

    def test_objs(self):

        # Test initializing struct params (also tests parent class fields)
        a = self.ns.C(a='test', b=123, c=b'\x00', d=3.14)
        self.assertEqual(a.a, 'test')
        self.assertEqual(a.b, 123)
        self.assertEqual(a.c, b'\x00')
        self.assertEqual(a.d, 3.14)

        # Test that void union member is available as a class attribute
        self.assertIsInstance(self.ns.U.t0, self.ns.U)

        # Test that non-void union member is callable (should be a method)
        self.assertTrue(callable(self.ns.U.t1))

    def test_struct_enumerated_subtypes_encoding(self):
        # Test serializing a leaf struct from  the root struct
        fi = self.ns.File(name='test.doc', size=100)
        self.assertEqual(
            self.compat_obj_encode(self.sv.StructTree(self.ns.Resource), fi),
            {'.tag': 'file', 'name': 'test.doc', 'size': 100})

        # Test that the .tag key comes first
        v = self.compat_obj_encode(self.sv.StructTree(self.ns.Resource), fi)
        self.assertEqual(list(v.keys())[0], '.tag')

        # Test serializing a leaf struct as the base and target
        self.assertEqual(
            self.compat_obj_encode(self.sv.Struct(self.ns.File), fi),
            {'name': 'test.doc', 'size': 100})

    def test_struct_enumerated_subtypes_decoding(self):
        # Test deserializing a leaf struct from  the root struct
        fi = self.compat_obj_decode(
            self.sv.StructTree(self.ns.Resource),
            {'.tag': 'file', 'name': 'test.doc', 'size': 100})
        self.assertIsInstance(fi, self.ns.File)
        self.assertEqual(fi.name, 'test.doc')
        self.assertEqual(fi.size, 100)

        # Test deserializing leaf struct with unknown type tag
        with self.assertRaises(self.sv.ValidationError) as cm:
            self.compat_obj_decode(
                self.sv.StructTree(self.ns.Resource),
                {'.tag': 'unk', 'name': 'test.doc'})
        self.assertEqual("unknown subtype 'unk'", str(cm.exception))

        # Test deserializing leaf struct with bad JSON type for type tag
        with self.assertRaises(self.sv.ValidationError) as cm:
            self.compat_obj_decode(
                self.sv.StructTree(self.ns.Resource),
                {'.tag': 123, 'name': 'test.doc'})
        self.assertEqual(".tag: expected string, got integer", str(cm.exception))

        # Test deserializing an unknown leaf in strict mode
        with self.assertRaises(self.sv.ValidationError) as cm:
            self.compat_obj_decode(
                self.sv.StructTree(self.ns.Resource),
                {'.tag': 'symlink', 'name': 'test'})
        self.assertEqual("unknown subtype 'symlink'", str(cm.exception))

        # Test deserializing an unknown leaf in non-strict mode
        r = self.compat_obj_decode(
            self.sv.StructTree(self.ns.ResourceLax),
            {'.tag': 'symlink', 'name': 'test'},
            strict=False)
        self.assertIsInstance(r, self.ns.ResourceLax)
        self.assertEqual(r.name, 'test')

        # Test deserializing an unknown leaf in non-strict mode, but with no
        # catch-all
        with self.assertRaises(self.sv.ValidationError) as cm:
            self.compat_obj_decode(
                self.sv.StructTree(self.ns.Resource),
                {'.tag': 'symlink', 'name': 'test'},
                strict=False)
        self.assertEqual(
            "unknown subtype 'symlink' and 'Resource' is not a catch-all",
            str(cm.exception))

    def test_defaults(self):
        # Test void type
        v = self.sv.Void()
        self.assertTrue(v.has_default())
        self.assertEqual(v.get_default(), None)

        # Test nullable type
        n = self.sv.Nullable(self.sv.Struct(self.ns.D))
        self.assertTrue(n.has_default())
        self.assertEqual(n.get_default(), None)

        # Test struct where all fields have defaults
        s = self.sv.Struct(self.ns.E)
        self.assertTrue(s.has_default())
        s.get_default()

        # Test struct where not all fields have defaults
        s = self.sv.Struct(self.ns.D)
        self.assertFalse(s.has_default())
        self.assertRaises(AssertionError, s.get_default)

    def tearDown(self):
        # Clear output of stone tool after all tests.
        shutil.rmtree('output')

    def test_msgpack(self):
        # Do a limited amount of testing just to make sure that unicode
        # handling and byte array handling are functional.

        # If the machine doesn't have msgpack, don't worry about these tests.
        try:
            from stone_serializers import (
                msgpack_encode,
                msgpack_decode,
            )
        except ImportError:
            return

        b = self.ns.B(a='hi', b=32, c=b'\x00\x01')
        s = msgpack_encode(self.sv.Struct(self.ns.B), b)
        b2 = msgpack_decode(self.sv.Struct(self.ns.B), s)
        self.assertEqual(b.a, b2.a)
        self.assertEqual(b.b, b2.b)
        self.assertEqual(b.c, b2.c)

        bs = b'\x00\x01'
        s = msgpack_encode(self.sv.Bytes(), bs)
        bs2 = msgpack_decode(self.sv.Bytes(), s)
        self.assertEqual(bs, bs2)

        u = u'\u2650'
        s = msgpack_encode(self.sv.String(), u)
        u2 = msgpack_decode(self.sv.String(), s)
        self.assertEqual(u, u2)

    def test_alias_validators(self):

        def aliased_string_validator(val):
            if ' ' in val:
                raise self.sv.ValidationError('No spaces allowed')
        aliased_validators = {
            self.ns.AliasedString_validator: aliased_string_validator}

        #
        # Test decoding
        #

        with self.assertRaises(self.sv.ValidationError) as cm:
            self.compat_obj_decode(
                self.ns.AliasedString_validator,
                'hi there',
                alias_validators=aliased_validators)
        self.assertEqual("No spaces allowed", str(cm.exception))

        with self.assertRaises(self.sv.ValidationError) as cm:
            self.compat_obj_decode(
                self.sv.Struct(self.ns.ContainsAlias),
                {'s': 'hi there'},
                alias_validators=aliased_validators)
        self.assertEqual("s: No spaces allowed", str(cm.exception))

        #
        # Test encoding
        #

        with self.assertRaises(self.sv.ValidationError) as cm:
            self.compat_obj_encode(
                self.ns.AliasedString_validator,
                'hi there',
                alias_validators=aliased_validators)
        self.assertEqual("No spaces allowed", str(cm.exception))

        ca = self.ns.ContainsAlias(s='hi there')
        with self.assertRaises(self.sv.ValidationError) as cm:
            self.compat_obj_encode(
                self.sv.Struct(self.ns.ContainsAlias),
                ca,
                alias_validators=aliased_validators)
        self.assertEqual("s: No spaces allowed", str(cm.exception))

    def test_struct_union_default(self):
        s = self.ns.S3()
        assert s.u == self.ns2.BaseU.z

# Adapted from:
# http://code.activestate.com/recipes/306860-proleptic-gregorian-dates-and-strftime-before-1900/
# Make sure that the day names are in order from 0001/01/01 until
# 2000/08/01
class TestCustomStrftime(unittest.TestCase):
    def test_strftime(self):
        s = stone_strftime(datetime.date(1800, 9, 23), '%Y has the same days as 1980 and 2008')
        assert s == '1800 has the same days as 1980 and 2008'

        # Get the weekdays. Can't hard code them; they could be localized.
        days = []

        for i in range(1, 10):
            days.append(datetime.date(2000, 1, i).strftime('%A'))

        nextday = {}

        for i in range(8):
            nextday[days[i]] = days[i + 1]

        startdate = datetime.date(1, 1, 1)
        enddate = datetime.date(2000, 8, 1)
        prevday = stone_strftime(startdate, '%A')
        one_day = datetime.timedelta(1)

        testdate = startdate + one_day

        while testdate < enddate:
            day = stone_strftime(testdate, '%A')
            assert nextday[prevday] == day, str(testdate)
            prevday = day
            testdate = testdate + one_day


if __name__ == '__main__':
    unittest.main()
