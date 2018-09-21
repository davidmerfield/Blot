var async = require("async");
var Change = require("sync").change;
var Sync = require("sync");
var debug = require("debug")("client:git:listener");
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
    var git = Git(localPath(blog.id, '/'));

    git.pull(function(err, info) {
      if (err) return callback(err);

      debug(info);
      async.eachSeries(info.files, handle, callback);

      // if there are no files we should probably wait and re-pull?
      
      function handle(path, next) {

        // Blot likes leading slashes
        if (path[0] !== "/") path = "/" + path;

        if (info.insertions[path]) {
          debug("Calling set with", blog.id, path);
          return Change.set(blog, path, next);
        }

        if (info.deletions[path]) {
          debug("Calling drop with", blog.id, path);
          return Change.drop(blog.id, path, next);
        }

        debug("Warning", path, "is a file but not in insertions or deletions");
        next();
      }
    });
  };
}