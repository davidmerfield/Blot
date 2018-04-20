var helper = require('../../../helper');
var ensure = helper.ensure;

var normalize = helper.pathNormalizer;

var Ignore = require('./ignore');
var Metadata = require('../../../models/metadata');
var Entry = require('../../../models/entry');
var Preview = require('../../../modules/preview');
var isPreview = require('../../../drafts').isPreview;

var catchRename = require('./catchRename').forCreated;

var file = require('../../../models/entry/build/file');
var WRONG_TYPE = 'WRONG_TYPE';
var PUBLIC_FILE = 'PUBLIC_FILE';

function isPublic (path) {
  return normalize(path).indexOf('/public/') === 0 || normalize(path).indexOf('/_') === 0;
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

    if (err) return callback(err);

    isPreview(blog.id, path, function(err, is_preview){

      if (err) return callback(err);

      // This is a preview file, don't create an entry
      if (is_preview) return callback();

      // The file belongs to a template and there
      // fore should not become a blog post.
      if (isTemplate(path)) return callback();

      // The file is public. Its name begins
      // with an underscore, or it's inside a folder
      // whose name begins with an underscore. It should
      // therefore not be a blog post.
      if (isPublic(path)) 
        return Ignore(blog.id, path, PUBLIC_FILE, callback);

      // This file cannot become a blog post because it is not
      // a type that Blot can process properly.
      if (isWrongType(path))
       return Ignore(blog.id, path, WRONG_TYPE, callback);

      Entry.build(blog, path, function(err, entry){

        if (err) return callback(err);

        // this checks the entry to see if a deleted entry
        // matches it. If so, then use the deleted entry's url and created date.
        catchRename(blog.id, entry, function(err, changes){

          if (err) throw err;

          if (changes)
            for (var key in changes)
              entry[key] = changes[key];

          // This file is a draft, write a preview file
          // to the users Dropbox and continue down
          // We look up the remote path later in this module...
          if (entry.draft) Preview.write(blog.id, path);

          Entry.set(blog.id, entry.path, entry, callback);
        });
      });
    });
  });
};




