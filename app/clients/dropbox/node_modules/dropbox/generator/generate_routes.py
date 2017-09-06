#!/usr/bin/env python
from __future__ import absolute_import, division, print_function, unicode_literals

import argparse
import glob
import json
import os
import subprocess
import sys

cmdline_desc = """\
Runs Stone to generate JS routes for the Dropbox client.
"""

_cmdline_parser = argparse.ArgumentParser(description=cmdline_desc)
_cmdline_parser.add_argument(
    '-v',
    '--verbose',
    action='store_true',
    help='Print debugging statements.',
)
_cmdline_parser.add_argument(
    'spec',
    nargs='*',
    type=str,
    help='Path to API specifications. Each must have a .stone extension.',
)
_cmdline_parser.add_argument(
    '-s',
    '--stone',
    type=str,
    help='Path to clone of stone repository.',
)


def main():
    """The entry point for the program."""

    args = _cmdline_parser.parse_args()
    verbose = args.verbose

    if args.spec:
        specs = args.spec
    else:
        # If no specs were specified, default to the spec submodule.
        specs = glob.glob('spec/*.stone')  # Arbitrary sorting
        specs.sort()

    specs = [os.path.join(os.getcwd(), s) for s in specs]

    stone_path = os.path.abspath('stone')
    if args.stone:
        stone_path = args.stone

    dropbox_pkg_path = os.path.abspath(
        os.path.join(os.path.dirname(sys.argv[0]), '../src'))
    if verbose:
        print('Dropbox package path: %s' % dropbox_pkg_path)
    typescript_template_path = os.path.abspath(
        os.path.join(os.path.dirname(sys.argv[0]), 'typescript'))
    if verbose:
        print('TypeScript template path: %s' % typescript_template_path)

    upload_arg = {
        "match": ["style", "upload"],
        "arg_name": "contents",
        "arg_type": "Object",
        "arg_docstring": "The file contents to be uploaded."
    }

    if verbose:
        print('Generating JS types')
    subprocess.check_output(
        (['python', '-m', 'stone.cli', 'js_types', dropbox_pkg_path] +
         specs + ['-b', 'team'] + ['-a', 'host', '-a', 'style', '-a', 'auth'] +
         ['--', 'types.js', '-e', json.dumps(upload_arg)]),
        cwd=stone_path)

    if verbose:
        print('Generating JS client routes for user routes')
    subprocess.check_output(
        (['python', '-m', 'stone.cli', 'js_client', dropbox_pkg_path] +
         specs + ['-b', 'team'] + ['-a', 'host', '-a', 'style', '-a', 'auth'] +
         ['--', 'routes.js', '-c', 'Dropbox']),
        cwd=stone_path)

    if verbose:
        print('Generating JS client routes for team routes')
    subprocess.check_output(
        (['python', '-m', 'stone.cli', 'js_client', dropbox_pkg_path] +
         specs + ['-w', 'team', '-f', 'style!="upload" and style!="download"'] +
         ['-a', 'host', '-a', 'style', '-a', 'auth'] + ['--', 'routes-team.js', '-c', 'DropboxTeam']),
        cwd=stone_path)

    if verbose:
        print('Generating TSD types')
    subprocess.check_output(
        (['python', '-m', 'stone.cli', 'tsd_types', typescript_template_path] +
         specs + ['-b', 'team'] + ['-a', 'host', '-a', 'style'] +
         ['--', 'dropbox_types.d.tstemplate', 'dropbox_types.d.ts', '-e', json.dumps(upload_arg)]),
        cwd=stone_path)

    if verbose:
        print('Generating TSD client routes for user routes')
    subprocess.check_output(
        (['python', '-m', 'stone.cli', 'tsd_client', typescript_template_path] +
         specs + ['-b', 'team'] + ['-a', 'host', '-a', 'style'] +
         ['--', 'dropbox.d.tstemplate', 'dropbox.d.ts']),
        cwd=stone_path)

    if verbose:
        print('Generating TSD client routes for team routes')
    subprocess.check_output(
        (['python', '-m', 'stone.cli', 'tsd_client', typescript_template_path] +
         specs + ['-w', 'team', '-f', 'style!="upload" and style!="download"'] +
         ['-a', 'host', '-a', 'style'] + ['--', 'dropbox_team.d.tstemplate', 'dropbox_team.d.ts']),
        cwd=stone_path)

if __name__ == '__main__':
    main()
