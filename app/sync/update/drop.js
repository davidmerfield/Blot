var async = require('async');
var Entry = require("entry");
var Metadata = require("metadata");
var Ignored = require("ignored");
var Rename = require("./catchRename");
var Preview = require("../../modules/preview");
var isDraft = require("../../drafts").isDraft;
var rebuildDependents = require("./rebuildDependents");

module.exports = function(blogID, path, options, callback) {

  // We don't know if this file used to be a draft based
  // on its metadata. We should probably look this up?
  isDraft(blogID, path, function(err, is_draft) {
    
    // ORDER IS IMPORTANT
    // Rebuild must happen after we remove the file from disk
    var queue = [
      Metadata.drop.bind(this, blogID, path),
      Ignored.drop.bind(this, blogID, path),
      Rename.forDeleted.bind(this, blogID, path),
      Entry.drop.bind(this, blogID, path),
      rebuildDependents.bind(this, blogID, path)
    ];

    if (is_draft) Preview.remove(blogID, path);

    async.eachSeries(
      queue,
      function(method, next) {
        method(next);
      },
      callback
    );
  });
};
