'use strict';
const path = require('path');
const trimRepeated = require('trim-repeated');
const filenameReservedRegex = require('filename-reserved-regex');
const stripOuter = require('strip-outer');

// Doesn't make sense to have longer filenames
const MAX_FILENAME_LENGTH = 100;

const reControlChars = /[\x00-\x1f\x80-\x9f]/g; // eslint-disable-line no-control-regex
const reRelativePath = /^\.+/;

const fn = module.exports = (str, opts) => {
	if (typeof str !== 'string') {
		throw new TypeError('Expected a string');
	}

	opts = opts || {};

	const replacement = opts.replacement || '!';

	if (filenameReservedRegex().test(replacement) && reControlChars.test(replacement)) {
		throw new Error('Replacement string cannot contain reserved filename characters');
	}

	str = str.replace(filenameReservedRegex(), replacement);
	str = str.replace(reControlChars, replacement);
	str = str.replace(reRelativePath, replacement);

	if (replacement.length > 0) {
		str = trimRepeated(str, replacement);
		str = str.length > 1 ? stripOuter(str, replacement) : str;
	}

	str = filenameReservedRegex.windowsNames().test(str) ? str + replacement : str;
	str = str.slice(0, MAX_FILENAME_LENGTH);

	return str;
};

fn.path = (pth, opts) => {
	pth = path.resolve(pth);
	return path.join(path.dirname(pth), fn(path.basename(pth), opts));
};
