var fs = require("fs-extra");
var localPath = require("helper").localPath;
var async = require("async");
var HOSTS = process.env.BLOT_DIRECTORY + "/data/hosts";

module.exports = function(blogID, add, remove, callback) {
  var blogFolder = localPath(blogID, "/").slice(0, -1);
  var staticFolder = process.env.BLOT_DIRECTORY + "/static/" + blogID;

  async.parallel([addSymlinks, removeSymlinks], callback);

  function addSymlinks(done) {
    var links = [];
    var dirs = [blogFolder, staticFolder];

    add.forEach(function(host) {
      dirs.push(HOSTS + "/" + host);
      links.push({ from: blogFolder, to: HOSTS + "/" + host + "/folder" });
      links.push({ from: staticFolder, to: HOSTS + "/" + host + "/static" });
    });

    async.each(dirs, fs.ensureDir, function(err) {
      if (err) return done(err);

      async.each(
        links,
        function(link, next) {
          fs.symlink(link.from, link.to, function(err) {
            if (err && err.code !== "EEXIST") return next(err);
            next();
          });
        },
        done
      );
    });
  }

  function removeSymlinks(done) {
    async.each(
      remove,
      function(host, next) {
        fs.remove(HOSTS + "/" + host, next);
      },
      done
    );
  }
};
