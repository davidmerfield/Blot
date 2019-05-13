var config = require("config");
var flush = require("helper")["express-disk-cache"](config.cache_directory)
  .flush;
var get = require("./get");

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

      if (!blog.domain) return callback();

      flush(blog.domain, callback);
    });
  });
};
