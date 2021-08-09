#!/bin/sh

# the quotes are important otherwise the shell expands the glob in 
# a way that wont recurse subdirectories
prettier --config package.json --write\
 'app/**/*.js' '!app/*/views' '!app/templates' '!app/build/plugins/*/public.js'\
 'scripts/**/*.js' '!scripts/state'\
 'config/**/*.js'\
 'tests/**/*.js'
