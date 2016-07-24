var helper = require('../../../helper');
var ensure = helper.ensure;
var mkdirp = helper.mkdirp;

var LocalPath = helper.localPath;
var RemotePath = require('../remotePath');

var shouldIgnore = require('./shouldIgnore');
var normalize = helper.pathNormalizer;

var Ignore = require('./ignore');
var Metadata = require('../../../models/metadata');
var Entry = require('../../../models/entry');
var Preview = require('../../../modules/preview');
var isDraft = require('../../../drafts').isDraft;

var download = require('./download');


function isPublic (path) {
  return normalize(path).indexOf('/public/') === 0;
}

function isTemplate (path) {
  return normalize(path).indexOf('/templates/') === 0;
}

module.exports = function (blog, change, client, callback){

  ensure(blog, 'object')
    .and(change, 'object')
    .and(change.path, 'string')
    .and(client, 'object')
    .and(callback, 'function');

  var path = change.path;
  var remotePath = RemotePath(blog.folder, path);
  var localPath = LocalPath(blog.id, path);

  Metadata.add(blog.id, path, function(err){

    if (err) throw err;

    // Determine if this file should be ignored
    // the response from shouldIgnore is a string
    // containing a reason, or 'false' if not.
    var reasonToIgnore = shouldIgnore(change);

    if (reasonToIgnore) {
      return Ignore(blog, change, reasonToIgnore, client, callback);
    }

    if (change.stat && change.stat.is_dir) {
      return mkdirp(localPath, callback);
    }

    // This file is a draft, write a preview file
    // to the users Dropbox and continue down
    // We look up the remote path later in this module...
    if (isDraft(path)) {
      Preview.write(blog.id, client, path);
    }

    download(client, remotePath, localPath, function (error) {

      if (error)
        return callback(error);

      // The file belongs to a template
      // rebuilding a template happens when the sync is over
      // why? I do not know..
      if (isPublic(path) || isTemplate(path))
        return callback();

      Entry.build(blog, path, function(err, entry){

        if (err) return callback(err);

        Entry.save(blog.id, entry, callback);
      });
    });
  });
};




