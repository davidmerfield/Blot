#!/bin/sh

set -e

grep -rnwl app -e "require([\"']$1[\"'])" --exclude-dir=importer --include=\*.js