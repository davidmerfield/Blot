var isPreview = require('../../../drafts').isPreview;
var helper = require('../../../helper');
var ensure = helper.ensure;
var normalize = helper.pathNormalizer;
var file = require('../../../models/entry/build/file');

var MAX_FILE_SIZE = 5 * 1024 * 1024; // 10 mb

var REASONS = {
  WRONG_TYPE: 'WRONG_TYPE',
  TOO_LARGE: 'TOO_LARGE',
  PREVIEW: 'PREVIEW'
};

function isPublic (path) {
  return normalize(path).indexOf('/public/') === 0;
}

function isTemplate (path) {
  return normalize(path).indexOf('/templates/') === 0;
}


module.exports = function(file) {

  ensure(file, 'object');

  if (file.stat && file.stat.is_dir)
    return false;

  // This must go up top
  // since we want to ignore
  // all large files, even for public
  // and templates.
  if (tooLarge(file)) return REASONS.TOO_LARGE;

  // Public and template files
  // have none of the restrictions below.
  if (isPublic(file.path) ||
      isTemplate(file.path) ||
      file.wasRemoved) return false;

  if (isPreview(file.path)) return REASONS.PREVIEW;

  if (isWrongType(file.path)) return REASONS.WRONG_TYPE;

  return false;
};

function isWrongType (path) {

  var isWrong = true;

  for (var i in file)
    if (file[i].is(path))
      isWrong = false;

  return isWrong;
}

function tooLarge (file) {
  return file && file.stat && file.stat.size && file.stat.size > MAX_FILE_SIZE;
}

var assert = require('assert');

function testWT (path, expected) {
  try {
    assert(isWrongType(path) === expected);
  } catch (e) {
    console.log('INPUT:', path)
    console.log('OUTPUT:', isWrongType(path));
    console.log('EXPECTED:', expected);
  }
}

// Blot should process
testWT('/foo.html', false);
testWT('foo.html', false);
testWT('/foo.txt', false);
testWT('/foo.md', false);
testWT('/foo.markdown', false);
testWT('/foo.htm', false);
testWT('/foo.jpg', false);
testWT('/foo.docx', false);
testWT('/foo/.doc/bar.jpeg', false);

// Blot should ignore
testWT('/f/o/o/.jpeg', true);
testWT('/f/o/o.doc', true);
testWT('/foo.pdf', true);