var fs = require("fs-extra");
var config = require("config");
var localPath = require("helper").localPath;
var async = require("async");

module.exports = function(blogID, add, remove, callback) {
  var blogFolder = localPath(blogID, "/").slice(0, -1);

  async.each(
    add,
    function(host, next) {
      var folder = config.cache_directory + "/" + host + "/folder";

      fs.symlink(blogFolder, folder, next);
    },
    function(err) {
      if (err) return callback(err);

      async.each(
        remove,
        function(host, next) {
          var folder = config.cache_directory + "/" + host + "/folder";

          fs.remove(folder, next);
        },
        callback
      );
    }
  );
};
