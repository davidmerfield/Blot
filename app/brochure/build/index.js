const fs = require("fs-extra");
const OUTPUT = __dirname + "/../data/views";
const INPUT = __dirname + "/../views";
const chokidar = require("chokidar");
const { join } = require("path");
const finder = require("finder");

async function main(callback) {
  // we should create a tmp dir during the build, then replace OUTPUT
  // with the tmp dir once the build is done.
  await fs.emptyDir(OUTPUT);

  const watcher = chokidar.watch(INPUT, { cwd: INPUT });

  watcher.on("add", handle).on("change", handle).on("ready", function(){
    // setTimeout(callback, 2*1000);
  });
}

async function handle(path) {
  if (path.endsWith(".css")) {
    const CleanCSS = require("clean-css");
    let input = await fs.readFile(join(INPUT, path), "utf-8");
    let output = new CleanCSS().minify(input).styles;
    console.log("css", path, output);
    await fs.outputFile(join(OUTPUT, path), output);
    // merge all css files together into one file
    const cssDir = join(OUTPUT, "css");
    const cssFiles = fs.readdirSync(cssDir).filter((i) => i.endsWith(".css"));
    const mergedCSS = cssFiles
      .map((i) => fs.readFileSync(join(cssDir, i)), "utf-8")
      .join("\n\n");
    fs.outputFileSync(join(cssDir, "complete.css"), mergedCSS);
  } else if (path.endsWith(".html")) {
    // Inlines all CSS properties
    // brochure.use(require("./tools/inline-css"));

    // // Renders the folders and text editors
    // brochure.use(finder.middleware);

    // // Generate a table of contents for each page
    // brochure.use(require("./tools/on-this-page"));

    let output = await fs.readFile(join(INPUT, path), "utf-8");

    output = require("./typeset")(output);
    output = require("./tex")(output);
    output = finder.html_parser(output);

    // output = require("./minify-html")(output);

    console.log("html", path);
    await fs.outputFile(join(OUTPUT, path), output);
  } else {
    await fs.copy(join(INPUT, path), join(OUTPUT, path));
  }
}

if (require.main === module) {
  main(function (err) {
    if (err) throw err;
    process.exit();
  });
}

module.exports = main;
