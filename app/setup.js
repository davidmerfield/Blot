const config = require("config");
const fs = require("fs-extra");

const client = require("models/client");
const documentation = require("./documentation/build");
const templates = require("./templates");
const folders = require("./templates/folders");
const async = require("async");
const clfdate = require("helper/clfdate");
const scheduler = require("./scheduler");
const flush = require("documentation/tools/flush-cache");
const configureLocalBlogs = require("./configure-local-blogs");

const log = (...args) =>
  console.log.apply(null, [clfdate(), "Setup:", ...args]);

function main(callback) {
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
        // we only want to build the templates once per deployment
        if (config.master) {
          log("Building templates");
          templates(
            // we only want to watch for changes in the templates in development
            { watch: config.environment === "development" },
            function (err) {
              if (err) throw err;
              log("Built templates");
              callback();
            }
          );
        } else {
          log("Skipping template build");
          callback();
        }
      },

      async function () {
        // The docker build stage for production runs this script ahead of time
        if (config.environment !== "development") return;
        await documentation({ watch: true });
      },

      async function () {
        if (config.environment !== "production") return;
        if (!config.master) return;

        log("Building folders");
        try {
          await folders();
          log("Built folders");
        } catch (e) {
          log("Error building folders", e);
        }
      },

      function (callback) {
        if (!config.master) return callback();

        // Launch scheduler for background tasks, like backups, emails
        scheduler();
        callback();
      },

      function (callback) {
        if (!config.master) return callback();

        // Run any initialization that clients need
        // Google Drive will renew any webhooks, e.g.
        for (const { init, display_name } of Object.values(
          require("clients")
        )) {
          if (init) {
            console.log(clfdate(), display_name + " client:", "Initializing");
            init();
          }
        }
        callback();
      },

      function (callback) {
        // Flush the cache of the public site and documentation
        flush();

        callback();
      },

      function (callback) {
        if (config.environment !== "development") return callback();
        configureLocalBlogs();
      },
    ],
    callback
  );
}

module.exports = main;
