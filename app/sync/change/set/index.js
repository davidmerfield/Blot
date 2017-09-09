var helper = require('../../../helper');
var ensure = helper.ensure;

var normalize = helper.pathNormalizer;

var Ignore = require('./ignore');
var Metadata = require('../../../models/metadata');
var Entry = require('../../../models/entry');
var Preview = require('../../../modules/preview');
var isDraft = require('../../../drafts').isDraft;
var isPreview = require('../../../drafts').isPreview;

var catchRename = require('./catchRename').forCreated;

var file = require('../../../models/entry/build/file');
var WRONG_TYPE = 'WRONG_TYPE';

function isPublic (path) {
  return normalize(path).indexOf('/public/') === 0;
}

function isTemplate (path) {
  return normalize(path).indexOf('/templates/') === 0;
}

function isWrongType (path) {

  var isWrong = true;

  for (var i in file)
    if (file[i].is(path))
      isWrong = false;

  return isWrong;
}

module.exports = function (blog, path, callback){

  ensure(blog, 'object')
    .and(path, 'string')
    .and(callback, 'function');

  Metadata.add(blog.id, path, function(err){

    if (err) throw err;

    // This file is a draft, write a preview file
    // to the users Dropbox and continue down
    // We look up the remote path later in this module...
    if (isDraft(path)) Preview.write(blog.id, path);

    // The file belongs to a template
    if (isPublic(path) || isTemplate(path)) return callback();

    // This is a preview file, don't create an entry
    if (isPreview(path)) return callback();

    // Determine if this file should be ignored
    // the response from shouldIgnore is a string
    // containing a reason, or 'false' if not.
    if (isWrongType(path))
     return Ignore(blog.id, path, WRONG_TYPE, callback);

    Entry.build(blog, path, function(err, entry){

      if (err) return callback(err);

      console.log('Blog: ' + blog.id + ': Checking entry for renames', entry.path);

      // this checks the entry to see if a deleted entry
      // matches it. If so, then use the deleted entry's url and created date.
      catchRename(blog.id, entry, function(err, changes){

        if (err) throw err;

        if (changes)
          for (var key in changes)
            entry[key] = changes[key];

        Entry.set(blog.id, entry.path, entry, callback);
      });
    });
  });
};




