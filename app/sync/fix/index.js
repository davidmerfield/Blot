var Blog = require("models/blog");
var entryGhosts = require("./entry-ghosts");
var listGhosts = require("./list-ghosts");
var menuGhosts = require("./menu-ghosts");
var tagGhosts = require("./tag-ghosts");

module.exports = function main(blog, callback) {
  if (!blog) return callback(new Error("No blog"));

  tagGhosts(blog, function (err) {
    if (err) return callback(err);
    entryGhosts(blog, function (err) {
      if (err) return callback(err);
      listGhosts(blog, function (err) {
        if (err) return callback(err);
        menuGhosts(blog, function (err) {
          if (err) return callback(err);
          Blog.set(blog.id, { cacheID: Date.now() }, function (err) {
            if (err) return callback(err);
            console.log(
              "Blog",
              blog.id,
              "(" +
                "http://" +
                blog.handle +
                "." +
                require("config").host +
                ") Flushed cache"
            );
            callback(null);
          });
        });
      });
    });
  });
};
