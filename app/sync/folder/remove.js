var fs = require("fs-extra");
var helper = require("helper");
var async = require("async");
var LocalPath = helper.localPath;

var Entry = require("entry");
var Metadata = require("metadata");
var Ignored = require("ignored");
var Blog = require("blog");
var Preview = require("../../modules/preview");
var isDraft = require("../../drafts").isDraft;

var rebuildDependents = require("./util/rebuildDependents");
var Rename = require("./util/catchRename");

module.exports = function(blog) {
  return function(path, options, callback) {
    if (callback === undefined && typeof options === "function") {
      callback = options;
      options = {};
    }

    // We don't know if this file used to be a draft based
    // on its metadata. We should probably look this up?
    isDraft(blog.id, path, function(err, is_draft) {
      // ORDER IS IMPORTANT
      // Rebuild must happen after we remove the file from disk
      var queue = [
        Blog.dropFromMenu.bind(this, blog.id, path),
        fs.remove.bind(this, LocalPath(blog.id, path)),
        Metadata.drop.bind(this, blog.id, path),
        Ignored.drop.bind(this, blog.id, path),
        Rename.forDeleted.bind(this, blog, path),
        Entry.drop.bind(this, blog, path),
        rebuildDependents.bind(this, blog.id, path)
      ];

      if (is_draft) Preview.remove(blog.id, path);

      async.eachSeries(
        queue,
        function(method, next) {
          method(next);
        },
        callback
      );
    });
  };
};
