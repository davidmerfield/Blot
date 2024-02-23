#!/bin/sh

PATH_TO_THIS_FILE=$(readlink -f $0)
APP_ROOT=$(dirname $(dirname $(dirname $PATH_TO_THIS_FILE)))/app

# prevent exit error if grep finds no match
set +e
grep -rnwl $APP_ROOT -e "require([\"'].*$1.*[\"'])" --exclude-dir=importer --include=\*.js
set -e

