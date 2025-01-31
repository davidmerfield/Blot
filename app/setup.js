const config = require("config");
const root = require("helper/rootDir");
const fs = require("fs-extra");

const redis = require("models/redis");
const client = new redis();
const documentation = require("./documentation/build");
const templates = require("./templates");
const folders = require("./templates/folders");
const async = require("async");
const clfdate = require("helper/clfdate");
const configureLocalBlogs = require("./configure-local-blogs");

const log = (...arguments) =>
  console.log.apply(null, [clfdate(), "Setup:", ...arguments]);

function main (callback) {
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
      async function () {
        // we only want to build the documentation in development
        // in production we run node app/setup.js to build the documentation
        // before starting the server
        log("Building documentation");
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

      function (callback) {
        // we only want to build the templates in development
        // in production we run node app/setup.js to build the documentation
        // before starting the server
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

      async function ()  {

        if (config.environment === "development") {
          log("Configuring local blogs");
          await configureLocalBlogs();
          log("Configured local blogs");
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
