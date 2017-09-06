#!/usr/bin/env python

from __future__ import absolute_import, division, print_function, unicode_literals

import unittest

from stone.cli_helpers import parse_route_attr_filter


class MockRoute():
    """Used to test filtering on a route's attrs."""

    def __init__(self, attrs):
        self.attrs = attrs


class TestCLI(unittest.TestCase):

    def test_parse_route_attr_filter(self):

        _, errs = parse_route_attr_filter('*=3')
        self.assertNotEqual(len(errs), 0)

        _, errs = parse_route_attr_filter('test')
        self.assertEqual(len(errs), 1)
        self.assertEqual(errs[0], 'Unexpected end of expression.')

        _, errs = parse_route_attr_filter('hide=true)')
        self.assertNotEqual(len(errs), 0)

        _, errs = parse_route_attr_filter('(hide=true')
        self.assertNotEqual(len(errs), 0)

        _, errs = parse_route_attr_filter('hide=true and and size=1')
        self.assertNotEqual(len(errs), 0)

        # Test bool
        expr, errs = parse_route_attr_filter('hide=true')
        self.assertEqual(len(errs), 0)
        self.assertTrue(expr.eval(MockRoute({'hide': True})))
        self.assertFalse(expr.eval(MockRoute({'hide': 'true'})))

        # Test int
        expr, errs = parse_route_attr_filter('level=1')
        self.assertEqual(len(errs), 0)
        self.assertTrue(expr.eval(MockRoute({'level': 1})))
        self.assertFalse(expr.eval(MockRoute({'level': 2})))
        self.assertFalse(expr.eval(MockRoute({'level': '1'})))
        self.assertFalse(expr.eval(MockRoute({})))

        # Test float
        expr, errs = parse_route_attr_filter('f=1.25')
        self.assertEqual(len(errs), 0)
        self.assertTrue(expr.eval(MockRoute({'f': 1.25})))
        self.assertFalse(expr.eval(MockRoute({'f': 3})))
        self.assertFalse(expr.eval(MockRoute({'f': '1.25'})))
        self.assertFalse(expr.eval(MockRoute({})))

        # Test string
        expr, errs = parse_route_attr_filter('status="alpha"')
        self.assertEqual(len(errs), 0)
        self.assertTrue(expr.eval(MockRoute({'status': 'alpha'})))
        self.assertFalse(expr.eval(MockRoute({'status': 'beta'})))
        self.assertFalse(expr.eval(MockRoute({'status': 0})))
        self.assertFalse(expr.eval(MockRoute({})))

        # Test null
        expr, errs = parse_route_attr_filter('status=null')
        self.assertEqual(len(errs), 0)
        self.assertTrue(expr.eval(MockRoute({'status': None})))
        self.assertFalse(expr.eval(MockRoute({'status': 'beta'})))
        self.assertFalse(expr.eval(MockRoute({'status': 0})))
        self.assertTrue(expr.eval(MockRoute({})))

        # Test conjunction: or
        expr, errs = parse_route_attr_filter('a=1 or b=1')
        self.assertEqual(len(errs), 0)
        self.assertTrue(expr.eval(MockRoute({'a': 1})))
        self.assertTrue(expr.eval(MockRoute({'b': 1})))
        self.assertTrue(expr.eval(MockRoute({'a': 1, 'b': 1})))
        self.assertTrue(expr.eval(MockRoute({'a': 1, 'b': 10})))
        self.assertFalse(expr.eval(MockRoute({'a': '0', 'b': 0})))
        self.assertFalse(expr.eval(MockRoute({'a': 0})))
        self.assertFalse(expr.eval(MockRoute({})))

        # Test conjunction: and
        expr, errs = parse_route_attr_filter('a=1 and b=1')
        self.assertEqual(len(errs), 0)
        self.assertTrue(expr.eval(MockRoute({'a': 1, 'b': 1})))
        self.assertFalse(expr.eval(MockRoute({'a': 1})))
        self.assertFalse(expr.eval(MockRoute({'b': 1})))
        self.assertFalse(expr.eval(MockRoute({'a': 1, 'b': 10})))
        self.assertFalse(expr.eval(MockRoute({'a': '0', 'b': 0})))
        self.assertFalse(expr.eval(MockRoute({'a': 0})))
        self.assertFalse(expr.eval(MockRoute({})))

        # Test multiple conjunctions
        expr, errs = parse_route_attr_filter('a=1 or a=2 or a=3')
        self.assertEqual(len(errs), 0)
        self.assertTrue(expr.eval(MockRoute({'a': 1})))
        self.assertTrue(expr.eval(MockRoute({'a': 2})))
        self.assertTrue(expr.eval(MockRoute({'a': 3})))
        self.assertFalse(expr.eval(MockRoute({'a': 4})))

        # Test "and" has higher precendence than "or"
        expr, errs = parse_route_attr_filter('a=1 or a=2 and b=3 and c=4')
        self.assertEqual(len(errs), 0)
        self.assertTrue(expr.eval(MockRoute({'a': 1})))
        self.assertFalse(expr.eval(MockRoute({'a': 2})))
        self.assertTrue(expr.eval(MockRoute({'a': 2, 'b': 3, 'c': 4})))
        self.assertTrue(expr.eval(MockRoute({'a': 1, 'b': 3, 'c': 4})))
        self.assertFalse(expr.eval(MockRoute({'a': 0, 'b': 3, 'c': 4})))

        expr, errs = parse_route_attr_filter('a=2 and b=3 and c=4 or a=1')
        self.assertEqual(len(errs), 0)
        self.assertTrue(expr.eval(MockRoute({'a': 1})))
        self.assertFalse(expr.eval(MockRoute({'a': 2})))
        self.assertTrue(expr.eval(MockRoute({'a': 2, 'b': 3, 'c': 4})))
        self.assertTrue(expr.eval(MockRoute({'a': 1, 'b': 3, 'c': 4})))
        self.assertFalse(expr.eval(MockRoute({'a': 0, 'b': 3, 'c': 4})))

        # Test parentheses for overriding precedence
        expr, errs = parse_route_attr_filter('(a=1 or a=2) and b=3 and c=4')
        self.assertEqual(len(errs), 0)
        self.assertTrue(expr.eval(MockRoute({'a': 1, 'b': 3, 'c': 4})))
        self.assertTrue(expr.eval(MockRoute({'a': 2, 'b': 3, 'c': 4})))
        self.assertFalse(expr.eval(MockRoute({'a': 1})))
        self.assertFalse(expr.eval(MockRoute({'a': 1, 'b': 3})))


if __name__ == '__main__':
    unittest.main()
