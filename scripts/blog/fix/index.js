var colors = require("colors/safe");
var get = require("../../get/blog");
var Blog = require("../../../app/models/blog");
var entryGhosts = require("./entry-ghosts");
var listGhosts = require("./list-ghosts");
var menuGhosts = require("./menu-ghosts");
var tagGhosts = require("./tag-ghosts");

if (require.main === module) {
  get(process.argv[2], function (err, user, blog) {
    if (err) throw err;

    main(blog, function (err) {
      if (err) {
        console.error(colors.red("Error:", err.message));
        return process.exit(1);
      }

      process.exit();
    });
  });
}

function main(blog, callback) {
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
            console.log("Blog", blog.id, "(" + "http://" + blog.handle + "." + require('config').host + ") Flushed cache");
            callback(null);
          });
        });
      });
    });
  });
}
