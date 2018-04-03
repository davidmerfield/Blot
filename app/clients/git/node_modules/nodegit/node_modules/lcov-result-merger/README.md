# LCOV Result Merger
[![Build Status](https://travis-ci.org/mweibel/lcov-result-merger.png)](https://travis-ci.org/mweibel/lcov-result-merger)

When you have multiple test suites for the same application you still want to
have the code coverage across all testsuites.

This tool will handle this for you.

# Usage

`./node_modules/bin/lcov-result-merger 'FILE_PATTERN' ['OUTPUT_FILE']`


# Examples

## Use stdout
1. Generate LCOV Code Coverage into different files, e.g. `build/coverage/coverage_X.log`
2. Run `./node_modules/.bin/lcov-result-merger 'build/coverage/coverage_*.log'`
3. Use the stdout to pipe it to e.g. [Coveralls](http://coveralls.io)
4. Done.

## Use merged output file
1. Generate LCOV Code Coverage into different files, e.g. `build/coverage/coverage_X.log`
2. Run `./node_modules/.bin/lcov-result-merger 'build/coverage/coverage_*.log' 'target/coverage/coverage_merged.log'`
3. Done. Enjoy your merged file.

