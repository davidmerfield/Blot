var config = require("config");
var flush = require("express-disk-cache")(config.cache_directory).flush;
var get = require("./get");
var fs = require("fs-extra");
var localPath = require("helper").localPath;

// This empties the cache for a blog by emptying the cache
// for its Blot subdomain and its custom domain, if one is set
module.exports = function(blogID, callback) {
  callback =
    callback ||
    function(err) {
      if (err) throw err;
    };

  get({ id: blogID }, function(err, blog) {
    if (err) return callback(err);

    flush(blog.handle + "." + config.host, function(err) {
      if (err) return callback(err);

      var folderInCache =
        config.cache_directory +
        "/" +
        blog.handle +
        "." +
        config.host +
        "/folder";
      var folderInCacheDomain =
        config.cache_directory + "/" + blog.domain + "/folder";
      var blogFolder = localPath(blog.id, "/").slice(0, -1);

      console.log("symlinking", blogFolder, folderInCache);

      fs.symlink(blogFolder, folderInCache, function(err) {
        if (err) return callback(err);

        if (!blog.domain) return callback();

        console.log("symlinking", blogFolder, folderInCacheDomain);
        fs.symlink(blogFolder, folderInCacheDomain, function(err) {
          if (err) return callback(err);

          flush(blog.domain, callback);
        });
      });
    });
  });
};
