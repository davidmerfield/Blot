#!/usr/bin/env node

var vfs = require('vinyl-fs'),
	through = require('through2'),
	fs = require('fs'),
	lcovResultMerger = require('../index');

if (process.argv.length < 3) {
	console.error("");
	console.error("Usage: node lcov-result-merger 'pattern'" +
		" ['output file']");
	console.error("EX: node lcov-result-merger 'target/**/lcov.out'" +
		" 'target/lcov-merged.out'");
	console.error("");
	process.exit(1);
}

var files = process.argv[2];
var outputFile = process.argv[3];

vfs.src(files)
	.pipe(lcovResultMerger())
	.pipe(through.obj(function (file) {
		if ( outputFile ) {
			fs.writeFileSync(outputFile, file.contents);
		} else {
			process.stdout.write(file.contents);
		}
	}));
