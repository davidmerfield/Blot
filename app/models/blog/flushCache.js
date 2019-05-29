if (!process.env.BLOT_DIRECTORY)
  throw new Error("Please declare a BLOT_DIRECTORY environment variable");

var fs = require("fs-extra");
var async = require("async");
var config = require("config");
var flush = require("express-disk-cache")(config.cache_directory).flush;
var localPath = require("helper").localPath;
var HOSTS = config.cache_directory;
var BackupDomain = require("./util/backupDomain");
var debug = require('debug')('blot:blog:flushCache');

// This empties the cache for a blog by emptying the cache
// for its Blot subdomain and its custom domain, if one is set
module.exports = function(blogID, former, latest, callback) {

  var latestHosts = [];
  var affectedHosts = [];

  if (latest.domain) {
    latestHosts.push(latest.domain);
    affectedHosts.push(latest.domain);

    latestHosts.push(BackupDomain(latest.domain));
    affectedHosts.push(BackupDomain(latest.domain));
  }

  if (latest.handle) {
    latestHosts.push(latest.handle + "." + config.host);
    affectedHosts.push(latest.handle + "." + config.host);
  }

  if (former.handle) {
    affectedHosts.push(former.handle + "." + config.host);
  }

  if (former.domain) {
    affectedHosts.push(former.domain);
    affectedHosts.push(BackupDomain(former.domain));
  }

  debug('Emptying cache directories for:', affectedHosts);

  async.each(affectedHosts, flush, function(err) {
    if (err) return callback(err);

    // The purpose of this module is to set up a number of symlinks between the blogs
    // folder stored againsts its ID, e.g. blogs/XYZ and its host, e.g. /cache/example.com
    // This is designed to allow NGINX to serve static content without a way to lookup the
    // blog by ID, and will take load off the Node.js server

    // We make sure to remove symlinks when deleting a blog or renaming its hosts
    // e.g. handle or custom domain
    debug('Setting up symlinks to blog folder for', latestHosts);
    async.each(latestHosts, symlink.bind(null, blogID), callback);
  });
};

function symlink(blogID, host, callback) {
  var blogFolder = localPath(blogID, "/").slice(0, -1);
  var staticFolder = config.blog_static_files_dir + "/" + blogID;
  var dirs = [HOSTS + "/" + host, blogFolder, staticFolder];
  var links = [
    { from: blogFolder, to: HOSTS + "/" + host + "/folder" },
    { from: staticFolder, to: HOSTS + "/" + host + "/static" }
  ];

  async.each(dirs, fs.ensureDir, function(err) {
    if (err) return callback(err);

    async.each(
      links,
      function(link, next) {
        fs.symlink(link.from, link.to, function(err) {
          if (err && err.code !== "EEXIST") return next(err);

          next();
        });
      },
      callback
    );
  });
}
