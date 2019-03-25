var request = require("request");
var Blog = require("blog");
var async = require("async");
var fs = require("fs-extra");
var config = require("config");
var Cache = require("express-disk-cache");
var cache = new Cache(config.cache_directory);

// Think about version control!
var pathToSites = __dirname + "/data/index.json";

// Should only run in production, will pull in live
// whether or not domain is still connected to Blot
// fetch latest post date and template information.
// Can be run every hour...
function update(callback) {
  fs.readJson(pathToSites, function(err, sites) {
    if (err) return callback(err);

    async.filter(
      sites,
      function(site, next) {
        verify(site.host, function(err) {
          if (err) return next(false);
        });
      },
      function(err, sites) {
        fs.outputJson(pathToSites, sites);

        // Empty any existing responses
        cache.flush(config.host, function(err) {
          if (err) console.warn(err);
        });
      }
    );
  });
}

function verify(domain, callback) {
  Blog.getBy({ domain: domain }, function(err, blog) {
    if (err) return callback(err);

    if (!blog) return callback(new Error("No blog with domain " + domain));

    var options = {
      uri: "http://" + domain + "/verify/domain-setup",
      timeout: 1000,
      maxRedirects: 5
    };

    request(options, function(err, res, body) {
      if (err) return callback(err);

      if (body !== blog.handle)
        return callback(
          new Error("Mismatch for " + domain + " with handle " + blog.handle)
        );

      callback(null);
    });
  });
}

module.exports = update;
