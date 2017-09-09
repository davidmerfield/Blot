#!/usr/bin/env python

from __future__ import absolute_import, division, print_function, unicode_literals

import unittest

from stone.api import (
    ApiNamespace,
)
from stone.data_type import (
    Boolean,
    Float32,
    Float64,
    Int32,
    Int64,
    InvalidSpec,
    List,
    Map,
    ParameterError,
    String,
    Timestamp,
    UInt32,
    UInt64,
    Void,
)
from stone.data_type import (
    Struct,
    StructField,
    Union,
    UnionField,
)
from stone.lang.parser import (
    StoneExample,
    StoneExampleField,
    StoneExampleRef,
)


class TestStoneInternal(unittest.TestCase):
    """
    Tests the internal representation of a Stone.
    """

    def test_check_example(self):

        #
        # Test string
        #

        s = String(min_length=1, max_length=5)
        s.check_example(
            StoneExampleField(
                path='test.stone',
                lineno=1,
                lexpos=0,
                name='v',
                value='hello',
            ))

        with self.assertRaises(InvalidSpec) as cm:
            s.check_example(
                StoneExampleField(
                    path='test.stone',
                    lineno=1,
                    lexpos=0,
                    name='v',
                    value='',
                ))
        self.assertIn("'' has fewer than 1 character(s)", cm.exception.msg)

        #
        # Test list
        #

        l = List(String(min_length=1), min_items=1, max_items=3)

        l.check_example(
            StoneExampleField(
                path='test.stone',
                lineno=1,
                lexpos=0,
                name='v',
                value=['asd'],
            ))

        with self.assertRaises(InvalidSpec) as cm:
            l.check_example(
                StoneExampleField(
                    path='test.stone',
                    lineno=1,
                    lexpos=0,
                    name='v',
                    value=[],
                ))
        self.assertIn("has fewer than 1 item(s)", cm.exception.msg)

        #
        # Test list of lists
        #

        l = List(List(String(min_length=1), min_items=1))

        l.check_example(
            StoneExampleField(
                path='test.stone',
                lineno=1,
                lexpos=0,
                name='v',
                value=[['asd']],
            ))

        with self.assertRaises(InvalidSpec) as cm:
            l.check_example(
                StoneExampleField(
                    path='test.stone',
                    lineno=1,
                    lexpos=0,
                    name='v',
                    value=[[]],
                ))
        self.assertIn("has fewer than 1 item(s)", cm.exception.msg)

        #
        # Test Map type
        #

        m = Map(String(), String())
        # valid example
        m.check_example(
            StoneExampleField(
                path='test.stone',
                lineno=1,
                lexpos=0,
                name='v',
                value={"foo": "bar"}
            )
        )

        # does not conform to declared type
        with self.assertRaises(InvalidSpec):
            m.check_example(
                StoneExampleField(
                    path='test.stone',
                    lineno=1,
                    lexpos=0,
                    name='v',
                    value={1: "bar"}
                )
            )

        with self.assertRaises(ParameterError):
            # errors because only string types can be used as keys
            Map(Int32(), String())

        s = Struct('S', None, None)
        s.set_attributes(
            "Docstring",
            [
                StructField('a', UInt64(), 'a field', None),
                StructField('b', List(String()), 'a field', None),
            ],
        )

        s._add_example(
            StoneExample(
                'test.stone',
                lineno=1,
                lexpos=0,
                label='default',
                text='Default example',
                fields={
                    'a': StoneExampleField(
                        path='test.stone',
                        lineno=2,
                        lexpos=0,
                        name='a',
                        value=132,
                    ),
                    'b': StoneExampleField(
                        path='test.stone',
                        lineno=2,
                        lexpos=0,
                        name='b',
                        value=['a'],
                    ),
                }
            ))

    def test_string(self):

        s = String(min_length=1, max_length=3)

        # check correct str
        s.check('1')

        # check correct unicode
        s.check(u'\u2650')

        # check bad item
        with self.assertRaises(ValueError) as cm:
            s.check(99)
        self.assertIn('not a valid string', cm.exception.args[0])

        # check too many characters
        with self.assertRaises(ValueError) as cm:
            s.check('12345')
        self.assertIn('more than 3 character(s)', cm.exception.args[0])

        # check too few characters
        with self.assertRaises(ValueError) as cm:
            s.check('')
        self.assertIn('fewer than 1 character(s)', cm.exception.args[0])

    def test_int(self):

        i = Int32()

        # check valid Int32
        i.check(42)

        # check number that is too large
        with self.assertRaises(ValueError) as cm:
            i.check(2**31)
        self.assertIn('not within range', cm.exception.args[0])

        # check number that is too small
        with self.assertRaises(ValueError) as cm:
            i.check(-2**31 - 1)
        self.assertIn('not within range', cm.exception.args[0])

        i = UInt32()

        # check number that is too large
        with self.assertRaises(ValueError) as cm:
            i.check(2**32)
        self.assertIn('not within range', cm.exception.args[0])

        # check number that is too small
        with self.assertRaises(ValueError) as cm:
            i.check(-1)
        self.assertIn('not within range', cm.exception.args[0])

        i = Int64()

        # check number that is too large
        with self.assertRaises(ValueError) as cm:
            i.check(2**63)
        self.assertIn('not within range', cm.exception.args[0])

        # check number that is too small
        with self.assertRaises(ValueError) as cm:
            i.check(-2**63 - 1)
        self.assertIn('not within range', cm.exception.args[0])

        i = UInt64()

        # check number that is too large
        with self.assertRaises(ValueError) as cm:
            i.check(2**64)
        self.assertIn('not within range', cm.exception.args[0])

        # check number that is too small
        with self.assertRaises(ValueError) as cm:
            i.check(-1)
        self.assertIn('not within range', cm.exception.args[0])

        i = Int64(min_value=0, max_value=10)
        with self.assertRaises(ValueError) as cm:
            i.check(20)
        self.assertIn('20 is greater than 10', cm.exception.args[0])
        with self.assertRaises(ValueError) as cm:
            i.check(-5)
        self.assertIn('-5 is less than 0', cm.exception.args[0])

        # check that bad ranges are rejected
        self.assertRaises(ParameterError, lambda: Int64(min_value=0.1))
        self.assertRaises(ParameterError, lambda: Int64(max_value='10'))

    def test_boolean(self):

        b = Boolean()

        # check valid bool
        b.check(True)

        # check non-bool
        with self.assertRaises(ValueError) as cm:
            b.check('true')
        self.assertIn('not a valid boolean', cm.exception.args[0])

    def test_float(self):

        f = Float32()

        # check valid float
        f.check(3.14)

        # check non-float
        with self.assertRaises(ValueError) as cm:
            f.check('1.1')
        self.assertIn('not a valid real', cm.exception.args[0])

        f = Float64(min_value=0, max_value=100)
        with self.assertRaises(ValueError) as cm:
            f.check(101)
        self.assertIn('is greater than', cm.exception.args[0])

        with self.assertRaises(ParameterError) as cm:
            Float64(min_value=0, max_value=10**330)
        self.assertIn('too large for a float', cm.exception.args[0])

        with self.assertRaises(ParameterError) as cm:
            Float32(min_value=0, max_value=10**50)
        self.assertIn('greater than the maximum value', cm.exception.args[0])

        # check that bad ranges are rejected
        self.assertRaises(ParameterError, lambda: Float64(min_value=1j))
        self.assertRaises(ParameterError, lambda: Float64(max_value='10'))

    def test_timestamp(self):
        t = Timestamp('%a, %d %b %Y %H:%M:%S')

        # check valid timestamp
        t.check('Sat, 21 Aug 2010 22:31:20')

        # check bad timestamp
        with self.assertRaises(ValueError) as cm:
            t.check('Sat, 21 Aug 2010')
        self.assertIn('does not match format', cm.exception.args[0])

    def test_struct(self):

        ns = ApiNamespace('test')

        quota_info = Struct(
            'QuotaInfo',
            None,
            ns,
        )
        quota_info.set_attributes(
            "Information about a user's space quota.",
            [
                StructField('quota', UInt64(), 'Total amount of space.', None),
            ],
        )

        # add an example that doesn't fit the definition of a struct
        with self.assertRaises(InvalidSpec) as cm:
            quota_info._add_example(
                StoneExample(path=None,
                             lineno=None,
                             lexpos=None,
                             label='default',
                             text=None,
                             fields={'bad_field': StoneExampleField(
                                 None,
                                 None,
                                 None,
                                 'bad_field',
                                 'xyz123')}))
        self.assertIn('has unknown field', cm.exception.msg)

        quota_info._add_example(
            StoneExample(path=None,
                         lineno=None,
                         lexpos=None,
                         label='default',
                         text=None,
                         fields={'quota': StoneExampleField(
                             None,
                             None,
                             None,
                             'quota',
                             64000)}))

        # set null for a required field
        with self.assertRaises(InvalidSpec) as cm:
            quota_info._add_example(
                StoneExample(path=None,
                             lineno=None,
                             lexpos=None,
                             label='null',
                             text=None,
                             fields={'quota': StoneExampleField(
                                 None,
                                 None,
                                 None,
                                 'quota',
                                 None)}))
        self.assertEqual(
            "Bad example for field 'quota': null is not a valid integer",
            cm.exception.msg)

        self.assertTrue(quota_info._has_example('default'))

        quota_info.nullable = True

        # test for structs within structs
        account_info = Struct(
            'AccountInfo',
            None,
            ns,
        )
        account_info.set_attributes(
            "Information about an account.",
            [
                StructField('account_id', String(), 'Unique identifier for account.', None),
                StructField('quota_info', quota_info, 'Quota', None)
            ],
        )

        account_info._add_example(
            StoneExample(path=None,
                         lineno=None,
                         lexpos=None,
                         label='default',
                         text=None,
                         fields={
                             'account_id': StoneExampleField(
                                 None,
                                 None,
                                 None,
                                 'account_id',
                                 'xyz123'),
                             'quota_info': StoneExampleField(
                                 None,
                                 None,
                                 None,
                                 'quota_info',
                                 StoneExampleRef(
                                     None,
                                     None,
                                     None,
                                     'default'))})
        )

        account_info._compute_examples()

        # ensure that an example for quota_info is propagated up
        self.assertIn('quota_info', account_info.get_examples()['default'].value)

    def test_union(self):

        ns = ApiNamespace('files')

        update_parent_rev = Struct(
            'UpdateParentRev',
            None,
            ns,
        )
        update_parent_rev.set_attributes(
            "Overwrite existing file if the parent rev matches.",
            [
                StructField('parent_rev', String(), 'The revision to be updated.', None)
            ],
        )
        update_parent_rev._add_example(
            StoneExample(path=None,
                         lineno=None,
                         lexpos=None,
                         label='default',
                         text=None,
                         fields={'parent_rev': StoneExampleField(
                             None,
                             None,
                             None,
                             'parent_rev',
                             'xyz123')}))

        # test variants with only tags, as well as those with structs.
        conflict = Union(
            'WriteConflictPolicy',
            None,
            ns,
            True,
        )
        conflict.set_attributes(
            'Policy for managing write conflicts.',
            [
                UnionField(
                    'reject', Void(),
                    'On a write conflict, reject the new file.', None),
                UnionField(
                    'overwrite', Void(),
                    'On a write conflict, overwrite the existing file.', None),
                UnionField(
                    'update_if_matching_parent_rev', update_parent_rev,
                    'On a write conflict, overwrite the existing file.', None),
            ],
        )

        conflict._add_example(
            StoneExample(path=None,
                         lineno=None,
                         lexpos=None,
                         label='default',
                         text=None,
                         fields={'update_if_matching_parent_rev': StoneExampleField(
                             None,
                             None,
                             None,
                             'update_if_matching_parent_rev',
                             StoneExampleRef(None, None, None, 'default'))}))

        conflict._compute_examples()

        # test that only null value is returned for an example of a Void type
        self.assertEqual(conflict.get_examples()['reject'].value, {'.tag': 'reject'})

        # test that dict is returned for a tagged struct variant
        self.assertEqual(conflict.get_examples()['default'].value,
            {'.tag': 'update_if_matching_parent_rev', 'parent_rev': 'xyz123'})


if __name__ == '__main__':
    unittest.main()
