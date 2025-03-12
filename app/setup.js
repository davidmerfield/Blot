const config = require("config");
const fs = require("fs-extra");

const redis = require("models/redis");
const client = new redis();
const documentation = require("./documentation/build");
const templates = require("./templates");
const folders = require("./templates/folders");
const async = require("async");
const clfdate = require("helper/clfdate");
const log = (...arguments) =>
  console.log.apply(null, [clfdate(), "Setup:", ...arguments]);

// skip building the documentation if it's already been built
// this suggests that the server has already been started
// and this speeds up the restart process when we run out of memory
const SERVER_RESTART = config.environment === "production" && fs.existsSync(config.views_directory + "/documentation.html")

function main (callback) {

  if (SERVER_RESTART) {
    log("Server restart detected. Skipping setup.");
    return callback();
  }

  if (!config.master) {
    log("Not the master process. Skipping setup.");
    return callback();
  }

  async.series(
    [
      async function () {
        log("Creating required directories");
        await fs.ensureDir(config.blog_folder_dir);
        await fs.ensureDir(config.blog_static_files_dir);
        await fs.ensureDir(config.log_directory);
        await fs.ensureDir(config.tmp_directory);
        log("Created required directories");
      },

      function (callback) {
        // Blot's SSL certificate system requires the existence
        // of the domain key in redis. See config/nginx/auto-ssl.conf
        // for more information about the specific implementation.
        // Anyway, so that the homepage. We redirect the 'www' subdomain
        // to the apex domain, but we need to generate a cert to do this.
        // Typically, domain keys like domain:example.com store a blog's ID
        // but since the homepage is not a blog, we just use a placeholder 'X'
        log("Creating SSL key for redis");
        client.msetnx(
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

            log("Created SSL key for redis");
            callback();
          }
        );
      },
      
       function (callback) {
        // we only want to watch for changes in the templates in development
        log("Building templates");
        templates(
          { watch: config.environment === "development" },
          function (err) {
            if (err) throw err;
            log("Built templates");
            callback();
          }
        );
      },


      async function () {
        log("Building documentation");
        // we only want to watch for changes in the documentation in development
        await documentation({ watch: config.environment === "development" });
        log("Built documentation");
      },

      async function () {
        if (config.environment === "production") {
          log("Building folders");
          await folders();
          log("Built folders");
        }
      },


    ],
    callback
  );
}

if (require.main === module) {
  console.log("Setting up Blot...");
  main(function (err) {
    if (err) throw err;
    console.log("Setup complete!");
    process.exit();
  });
}

module.exports = main;
