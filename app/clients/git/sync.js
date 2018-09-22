var async = require("async");
var Change = require("sync").change;
var Sync = require("sync");
var debug = require("debug")("clients:git:sync");
var Git = require("simple-git");
var Blog = require("blog");
var localPath = require("helper").localPath;

module.exports = function sync(handle, callback) {
  Blog.get({ handle: handle }, function(err, blog) {
    if (err) return callback(err);
    Sync(blog.id, main(blog), callback);
  });
};

function main(blog) {
  return function(callback) {
    var git = Git(localPath(blog.id, "/")).silent(true);

    git.pull(function(err, info) {
      if (err) return callback(err);

      debug(info);

      async.eachSeries(
        info.created,
        function(path, next) {
          debug("Calling set with", blog.id, path);
          Change.set(blog, path, next);
        },
        function(err) {
          if (err) return callback(err);

          async.eachSeries(
            info.deleted,
            function(path, next) {
              debug("Calling drop with", blog.id, path);
              Change.drop(blog.id, path, next);
            },
            callback
          );
        }
      );
    });
  };
}
