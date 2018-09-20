var async = require("async");
var Change = require("sync").change;
var Sync = require("sync");
var debug = require("debug")("client:git:listener");
var Git = require("simple-git");
var Blog = require("blog");
var join = require("path").join;
var config = require("config");


module.exports = function sync (repo, callback) {
  var handle = repo.slice(0, ".git".length * -1);

  Blog.get({ handle: handle }, function(err, blog) {
    var git = Git(blog_dir(blog.id));

    git.pull(function(err, info) {
      if (err) {
        return callback(err);
      }

      debug("Blog folder is synchronized");
      debug(info);
      console.log(
        "Blog:",
        blog.id,
        "(" + handle + ")",
        "Git: post-receive",
        info
      );

      Sync(
        blog.id,
        function(callback) {
          async.eachSeries(
            info.files,
            function(path, next) {
              if (info.insertions[path]) {
                debug("Calling set with", blog.id, add_leading_slash(path));
                return Change.set(blog, add_leading_slash(path), next);
              }

              if (info.deletions[path]) {
                debug("Calling drop with", blog.id, add_leading_slash(path));
                return Change.drop(blog.id, add_leading_slash(path), next);
              }

              debug(
                "Warning",
                path,
                "is a file but not in insertions or deletions"
              );
              next();
            },
            callback
          );
        },
        function() {
          debug("Sync complete!");
          callback();
        }
      );
    });
  });
};


function blog_dir(blog_id) {
  return join(config.blog_folder_dir, blog_id);
}

function add_leading_slash(path) {
  if (path[0] === "/") return path;
  if (!path.length) return "/";
  return "/" + path;
}
