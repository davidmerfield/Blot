var root = require("helper").rootDir;
var fs = require("fs-extra");
var config = require("config");
var scheduler = require("./scheduler");
var express = require("express");
var compression = require("compression");
var vhost = require("vhost");
var helmet = require("helmet");
var redis = require("redis").createClient();
var dashboard = require("./dashboard");
var brochure = require("./brochure");
var blog = require("./blog");

var server = express();

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

// Prevent IE users from executing
// downloads in your site's context
// Prevent some browsers from
// sniffing some mimetypes
// Don't allow Blot to be used in iframes
// Create directive at /crossdomain.xml
// which prevents flash from doing shit
// Rendering middleware
var todayKey = "analytics:today";
var client = require("client");

server
  .disable("x-powered-by")
  .use(compression())
  .set("trust proxy", "loopback")
  .use(helmet.ieNoOpen())
  .use(helmet.noSniff())
  .use(helmet.frameguard("allow-from", config.host))
  .use(function(req, res, next) {
    next();

    return client.incr(todayKey, function(err) {
      if (err) console.log(err);
    });
  })
  .use(function(req, res, next) {
    res.setHeader("Cache-Hit", "false");
    next();
  })
  .use(vhost(config.host, dashboard))
  .use(vhost(config.host, brochure))

  // It is important that this route returns
  // 200 so that the script which determines
  // whether the server is health runs OK!
  // Don't remove it unless you change monit.rc
  // It needs to be here because VHOSTS prevent
  // it from working under the sites app
  .use("/health", function(req, res, next) {
    if (req.hostname === "localhost") res.send("OK");
    return next();
  })

  // Serve the blogs!
  .use(blog);

// Unleash the daemon for backups, syncs and emails
scheduler();

// Create empty directories if they don't exist
fs.ensureDirSync(root + "/blogs");
fs.ensureDirSync(root + "/tmp");
fs.ensureDirSync(root + "/logs");
fs.ensureDirSync(root + "/db");
fs.ensureDirSync(root + "/static");

// Create an HTTP service.
server.listen(config.port);
console.log("Blot server is listening on port " + config.port);
console.log("WARNING RENABLE CROSS DOMAINS (helmet)");
// .use(helmet.crossdomain())
