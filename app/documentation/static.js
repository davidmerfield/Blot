const Express = require("express");
const static = Express.Router();
const root = require("helper/rootDir");
const fs = require("fs-extra");
const { join } = require("path");
const { build } = require("esbuild");
const tmp = require("helper/tempDir")();

var documentation_static_files = join(root, "/app/views");

static

  .get("/documentation/:cacheid/documentation.min.js", async (req, res) => {
    await build({
      entryPoints: [join(documentation_static_files, "js/documentation.js")],
      bundle: true,
      minify: true,
      // sourcemap: true,
      target: ["chrome58", "firefox57", "safari11", "edge16"],
      outfile: join(tmp, "documentation.min.js")
    });

    const code = await fs.readFile(join(tmp, "documentation.min.js"), "utf-8");

    res.setHeader("Content-Type", "text/javascript");
    res.setHeader("Cache-Control", "public, max-age=604800");
    res.send(code);
  })

  .get("/documentation/:cacheid/style.min.css", async (req, res) => {
    // merge all css files together into one file
    const cssDir = join(documentation_static_files, "css");
    const cssFiles = (await fs.readdir(cssDir)).filter(i => i.endsWith(".css"));
    const cssContents = await Promise.all(
      cssFiles.map(name => fs.readFile(join(cssDir, name), "utf-8"))
    );

    const mergedCSS = cssContents.join("\n\n");

    res.setHeader("Content-Type", "text/css");
    res.setHeader("Cache-Control", "public, max-age=604800");
    res.send(mergedCSS);
  })

  .use(
    "/documentation/:cacheid/",
    Express.static(documentation_static_files, {
      index: false, // Without 'index: false' this will server the index.html files inside
      redirect: false, // Without 'redirect: false' this will redirect URLs to existent directories
      maxAge: 86400000,
      setHeaders: function (res) {
        res.setHeader("Access-Control-Allow-Origin", "*");
      }
    })
  )

  .use(
    "/documentation/fonts/",
    Express.static(documentation_static_files + "/fonts", {
      index: false, // Without 'index: false' this will serve the index.html files inside
      redirect: false, // Without 'redirect: false' this will redirect URLs to existent directories
      maxAge: 86400000,
      setHeaders: function (res) {
        res.setHeader("Access-Control-Allow-Origin", "*");
      }
    })
  );

module.exports = static;
