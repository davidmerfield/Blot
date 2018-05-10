var fs = require('fs-extra');
var helper = require('helper');
var forEach = helper.forEach; // Order is important, don't do parallel
var ensure = helper.ensure;
var LocalPath = helper.localPath;

var Entry = require('entry');
var Metadata = require('metadata');
var Ignored = require('ignored');
var Rename = require('./set/catchRename');
var Preview = require('../../modules/preview');
var isDraft = require('../../drafts').isDraft;
var rebuildDependents = require('./rebuildDependents');

module.exports = function (blogID, path, callback){

  ensure(blogID, 'string')
    .and(path, 'string')
    .and(callback, 'function');

  // We don't know if this file used to be a draft based 
  // on its metadata. We should probably look this up?
  isDraft(blogID, path, function(err, is_draft){

    // ORDER IS IMPORTANT
    // Rebuild must happen after we remove the file from disk
    var queue = [
      fs.remove.bind(this, LocalPath(blogID, path)),
      Metadata.drop.bind(this, blogID, path),
      Ignored.drop.bind(this, blogID, path),
      Rename.forDeleted.bind(this, blogID, path),
      Entry.drop.bind(this, blogID, path),
      rebuildDependents.bind(this, blogID, path)
    ];

    if (is_draft) Preview.remove(blogID, path);

    forEach(queue, function(method, next){

      method(next);

    }, callback);
  });
};
