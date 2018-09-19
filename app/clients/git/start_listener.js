var Git = require("simple-git");
var Blog = require("blog");
var Sync = require("sync");
var git_emit = require("git-emit-node7");
var async = require("async");
var debug = require("debug")("client:git:listener");
var config = require("config");
var join = require("path").join;

function blog_dir(blog_id) {
  return join(config.blog_folder_dir, blog_id);
}

function add_leading_slash(path) {
  if (path[0] === "/") return path;
  if (!path.length) return "/";
  return "/" + path;
}

module.exports = function start_listener(handle) {
  Blog.get({ handle: handle }, function(err, blog) {
    if (err || !blog) {
      return console.log("ERROR no blog", handle);
    }

    var blog_id = blog.id;
    var emitter, git;

    require("fs-extra").ensureDirSync(blog_dir(blog.id));

    try {
      emitter = git_emit(__dirname + "/data/" + blog.handle + ".git");
      git = Git(blog_dir(blog.id));
    } catch (e) {
      return console.log(e);
    }

    console.log("Blog:", blog_id, "(" + handle + ")", "Git: Initialized");

    debug("Initialized", blog_id, "git repo");

    emitter.on("post-rewrite", function(info) {
      console.log("Blog:", blog_id, "Git: post-rewrite", info);
    });

    emitter.on("post-receive", function(info) {
      console.log("Blog:", blog_id, "Git: post-receive", info);
    });

    emitter.on("post-update", function(info) {
      console.log("Blog:", blog_id, "Git: post-update", info);
    });

    emitter.on("update", function(update) {
      update.accept();
      console.log("Blog:", blog_id, "Git: update", update);
    });

    emitter.on("post-update", function() {
      debug("post-update called");

      git.pull(function(err, info) {
        if (err) {
          debug("error", err);
          return;
        }

        debug("Blog folder is synchronized");
        debug(info);
        console.log(
          "Blog:",
          blog_id,
          "(" + handle + ")",
          "Git: post-receive",
          info
        );

        Sync(blog_id, function(err, folder, release) {
          async.eachSeries(
            info.files,
            function(path, next) {
              folder.update(blog, add_leading_slash(path), next);
            },
            release
          );
        });
      });
    });
  });
};
