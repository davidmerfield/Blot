const config = require("config");
const root = require("helper/rootDir");
const fs = require("fs-extra");

const redis = require("models/redis");
const client = new redis();

const templates = require("./templates");
const async = require("async");
const clfdate = require("helper/clfdate");

const Cache = require("helper/express-disk-cache");
const cache = new Cache(config.cache_directory, { minify: true, gzip: true });

const log = (...arguments) =>
  console.log.apply(null, [clfdate(), "Setup:", ...arguments]);

function main (callback) {
  async.series(
    [
      async function () {
        log("Creating required directories");
        await fs.ensureDir(root + "/blogs");
        await fs.ensureDir(root + "/tmp");
        await fs.ensureDir(root + "/data");
        await fs.ensureDir(root + "/logs");
        await fs.ensureDir(root + "/db");
        await fs.ensureDir(root + "/static");
        await fs.ensureDir(root + "/app/clients/git/data");
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
        log("Building CSS and JS");
        buildCSSandJS();
        if (config.environment === "development") {
          const chokidar = require("chokidar");
          const async = require("async");
          const queue = async.queue(async function (arg, callback) {
            log("Re-building CSS and JS");
            await buildCSSandJS();
            callback();
          });

          let ready = false;
          chokidar
            .watch(documentation_static_files)
            .on("ready", function () {
              ready = true;
            })
            .on("all", (event, path) => {
              if (!ready) return;

              // only rebuild if a css or js file changes
              // and it's not the output file
              if (
                (path.endsWith(".css") || path.endsWith(".js")) &&
                !path.includes("documentation.min.js") &&
                !path.includes("style.min.css")
              ) {
                queue.push("build");
              } else {
                console.log("Ignoring change to", path);
              }
            });
        }

        log("Building templates");
        templates(
          { watch: config.environment === "development" },
          function (err) {
            if (err) throw err;
            log("Built templates");
            callback();
            // Build templates and watch directory
            if (config.environment === "development") {
              // Rebuilds templates when we load new states
              // using scripts/state/info.js
              const templateClient = new redis();

              templateClient.subscribe("templates:rebuild");
              templateClient.on("message", function () {
                templates({}, function () {});
              });
            }
          }
        );
      }
    ],
    callback
  );
}

const { blot_directory } = require("config");
const { join } = require("path");
const { build } = require("esbuild");

const documentation_static_files = join(blot_directory, "/app/views");

async function buildCSSandJS () {
  // merge all css files together into one file
  const cssDir = join(documentation_static_files, "css");
  const cssFiles = (await fs.readdir(cssDir)).filter(i => i.endsWith(".css"));
  const cssContents = await Promise.all(
    cssFiles.map(name => fs.readFile(join(cssDir, name), "utf-8"))
  );

  const mergedCSS = cssContents.join("\n\n");

  await fs.writeFile(
    join(documentation_static_files, "style.min.css"),
    mergedCSS
  );

  await build({
    entryPoints: [join(documentation_static_files, "js/documentation.js")],
    bundle: true,
    minify: true,
    // sourcemap: true,
    target: ["chrome58", "firefox57", "safari11", "edge16"],
    outfile: join(documentation_static_files, "documentation.min.js")
  });

  cache.flush({ host: config.host }, err => console.log(err));
}

if (require.main === module) {
  main(function (err) {
    if (err) throw err;
    process.exit();
  });
}

module.exports = main;
