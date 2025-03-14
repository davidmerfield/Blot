const BackupDomain = require("./util/backupDomain");
const flushCache = require("helper/flushCache");
const debug = require("debug")("blot:blog:flushCache");
const get = require("./get");

const config = require("config");
const { reverse_proxies } = config;
const flush = flushCache({ reverse_proxies });

// This empties the cache for a blog by emptying the cache
// for its Blot subdomain and its custom domain, if one is set
module.exports = function (blogID, former, callback) {
  // You can optionally pass the former state of the blog
  // to ensure that the cache directories for old domains
  // and blot subdomains are flushed too. It's not required.
  if (!callback && typeof former === "function") {
    callback = former;
    former = {};
  }

  const blogHosts = [];
  const affectedHosts = [];

  get({ id: blogID }, function (err, blog) {
    if (err) return callback(err);

    if (blog.domain) {
      blogHosts.push(blog.domain);
      affectedHosts.push(blog.domain);
      blogHosts.push(BackupDomain(blog.domain));
      affectedHosts.push(BackupDomain(blog.domain));
    }

    if (blog.handle) {
      blogHosts.push(blog.handle + "." + config.host);
      affectedHosts.push(blog.handle + "." + config.host);
    }

    if (former.handle && former.handle !== blog.handle) {
      affectedHosts.push(former.handle + "." + config.host);
    }

    if (former.domain && former.domain !== blog.domain) {
      affectedHosts.push(former.domain);
      affectedHosts.push(BackupDomain(former.domain));
    }

    // We make sure to empty cache directories when deleting a blog
    // This can be done in the background since it's not critical
    if (affectedHosts.length) {
      debug("Emptying cache directories for any affected hosts", affectedHosts);
      flush(affectedHosts)
        .then(() => {
          debug("Cache directories flushed for:", affectedHosts);
        })
        .catch((error) => {
          console.error("Error flushing cache directories:", error);
        });
    }

    callback();
  });
};
