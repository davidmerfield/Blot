// The purpose of this module is to set up a number of symlinks between the blogs
// folder stored againsts its ID, e.g. blogs/XYZ and its host, e.g. data/hosts/example.com
// This is designed to allow NGINX to serve static content without a way to lookup the
// blog by ID, and will take load off the Node.js server

// We make sure to remove symlinks when deleting a blog or renaming its hosts
// e.g. handle or custom domain

if (!process.env.BLOT_DIRECTORY)
  throw new Error("Please declare a BLOT_DIRECTORY environment variable");

var fs = require("fs-extra");
var localPath = require("helper").localPath;
var async = require("async");
var config = require("config");
var HOSTS = config.cache_directory;

// add and remove should be a list of hosts, e.g.
// ['example.blot.im', 'example.com']
module.exports = function(blogID, add, remove, callback) {
  var blogFolder = localPath(blogID, "/").slice(0, -1);
  var staticFolder = config.blog_static_files_dir + "/" + blogID;

  async.series([removeSymlinks, addSymlinks], callback);

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
