#!/usr/bin/env node

process.stdout.write(require('../slug')(process.argv[2], '_'));
