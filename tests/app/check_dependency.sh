#!/bin/sh

# prevent exit error if grep finds no match
set +e
grep -rnwl app -e "require([\"'].*$1.*[\"'])" --exclude-dir=importer --include=\*.js
set -e

