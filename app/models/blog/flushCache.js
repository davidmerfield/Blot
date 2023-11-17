var BackupDomain = require("./util/backupDomain");
var debug = require("debug")("blot:blog:flushCache");
var get = require("./get");
var config = require("config");
var proxy_hosts = config.reverse_proxies;

const fetch = require("node-fetch");

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

  // temporarily do nothing
  return callback();

  var blogHosts = [];
  var affectedHosts = [];

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
    if (affectedHosts.length) {
      debug("Emptying cache directories for:", affectedHosts);
      for (const host of proxy_hosts) {
        fetch(
          "http://" +
            host +
            "/purge?" +
            affectedHosts.map(host => "host=" + host).join("&"),
          {
            method: "PURGE"
          }
        )
          .then(res => {
            console.log(
              "proxy: " + host + " flushed:" + affectedHosts.join(",")
            );
          })
          .catch(e => {
            console.log(
              "proxy: " + host + " failed to flush: " + affectedHosts.join(",")
            );
          });
      }
    }

    callback();
  });
};
