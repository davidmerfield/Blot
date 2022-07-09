const config = require("config");
const root = require("helper/rootDir");
const fs = require("fs-extra");
const redis = require("redis").createClient();
const buildBrochure = require("./brochure/build");
const templates = require("./templates");
const async = require("async");

function main(callback) {
  async.series(
    [
      async function () {
        console.log("Creating required directories");
        await fs.ensureDir(root + "/blogs");
        await fs.ensureDir(root + "/tmp");
        await fs.ensureDir(root + "/data");
        await fs.ensureDir(root + "/logs");
        await fs.ensureDir(root + "/db");
        await fs.ensureDir(root + "/static");
        console.log("Created required directories");
      },
      function (callback) {
        // Blot's SSL certificate system requires the existence
        // of the domain key in redis. See config/nginx/auto-ssl.conf
        // for more information about the specific implementation.
        // Anyway, so that the homepage. We redirect the 'www' subdomain
        // to the apex domain, but we need to generate a cert to do this.
        // Typically, domain keys like domain:example.com store a blog's ID
        // but since the homepage is not a blog, we just use a placeholder 'X'
        console.log("Creating SSL key for redis");
        redis.msetnx(
          ["domain:" + config.host, "X", "domain:www." + config.host, "X"],
          function (err) {
            if (err) {
              console.error(
                "Unable to set domain flag for host" +
                  config.host +
                  ". SSL may not work on site."
              );
              console.error(err);
            }

            console.log("Created SSL key for redis");
            callback();
          }
        );
      },
      function (callback) {
        console.log("Building templates");
        templates({ watch: config.environment === "development" }, function (
          err
        ) {
          if (err) throw err;
          console.log("Built templates");
          callback();
          // Build templates and watch directory
          if (config.environment === "development") {
            // Rebuilds templates when we load new states
            // using scripts/state/info.js
            const client = require("redis").createClient();
            client.subscribe("templates:rebuild");
            client.on("message", function () {
              templates({}, function () {});
            });
          }
        });
      },
      function (callback) {
        console.log("Building brochure site");
        buildBrochure(
          { watch: config.environment === "development" },
          function (err) {
            if (err) throw err;
            console.log("Built brochure site");
            callback();
          }
        );
      },
    ],
    callback
  );
}

if (require.main === module) {
  main(function (err) {
    if (err) console.error(err);
    process.exit();
  });
}

module.exports = main;
