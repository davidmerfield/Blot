var config = require("config");
var root = require("helper").rootDir;
var fs = require("fs-extra");
var redis = require("redis").createClient();

// Blot's SSL certificate system requires the existence
// of the domain key in redis. See config/nginx/auto-ssl.conf
// for more information about the specific implementation.
// Anyway, so that the homepage. We redirect the 'www' subdomain
// to the apex domain, but we need to generate a cert to do this.
// Typically, domain keys like domain:example.com store a blog's ID
// but since the homepage is not a blog, we just use a placeholder 'X'
redis.mset(
  ["domain:" + config.host, "X", "domain:www." + config.host, "X"],
  function(err) {
    if (err) {
      console.error(
        "Unable to set domain flag for host" +
          config.host +
          ". SSL may not work on site."
      );
      console.error(err);
    }
  }
);

// Create empty directories if they don't exist
fs.ensureDirSync(root + "/blogs");
fs.ensureDirSync(root + "/tmp");
fs.ensureDirSync(root + "/logs");
fs.ensureDirSync(root + "/db");
fs.ensureDirSync(root + "/static");

process.exit();
