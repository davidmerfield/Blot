const Express = require("express");
const documentation = new Express();
const fs = require("fs-extra");

const VIEW_DIRECTORY = __dirname + "/../views";

// Without 'index: false' this will server the index.html files inside the
// views folder in lieu of using the render definied in ./routes below.
// Without 'redirect: false' this will redirect URLs to existent directories
// adding an undesirable trailing slash.
documentation.use(
  "/fonts",
  Express.static(VIEW_DIRECTORY + "/fonts", {
    index: false,
    redirect: false,
    maxAge: 86400000,
  })
);

documentation.get("/css/complete.css", async (req, res) => {
  const CleanCSS = require("clean-css");
  const { join } = require("path");

  // merge all css files together into one file
  const cssDir = join(VIEW_DIRECTORY, "css");

  const cssFiles = fs.readdirSync(cssDir).filter((i) => i.endsWith(".css"));

  const mergedCSS = cssFiles
    .map((i) => fs.readFileSync(join(cssDir, i), "utf-8"))
    .map((input) => new CleanCSS().minify(input).styles)
    .join("\n\n");

  res.header("Content-Type", "text/css");
  res.send(mergedCSS);
});

documentation.use(
  "/css",
  Express.static(VIEW_DIRECTORY + "/css", { index: false, redirect: false })
);

documentation.use(
  "/images",
  Express.static(VIEW_DIRECTORY + "/images", { index: false, redirect: false })
);

documentation.use(
  "/js",
  Express.static(VIEW_DIRECTORY + "/js", { index: false, redirect: false })
);

documentation.use(
  "/videos",
  Express.static(VIEW_DIRECTORY + "/videos", { index: false, redirect: false })
);

module.exports = documentation;
