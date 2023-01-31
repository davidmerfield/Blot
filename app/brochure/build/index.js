const fs = require("fs-extra");
const OUTPUT = __dirname + "/../data/views";
const INPUT = __dirname + "/../views";
const chokidar = require("chokidar");
const { join } = require("path");
const finder = require("finder");
const async = require("async");
const modifiedAndEditLink = require("./modified-and-edit-link");
const search = require("./search-index");

fs.ensureDirSync(OUTPUT);

async function main(options, callback) {
  // we should create a tmp dir during the build, then replace OUTPUT
  // with the tmp dir once the build is done.

  let walked = false;
  let moved = false;
  let called = false;

  const OUTPUT_TMP = OUTPUT + "-tmp-" + Date.now();
  const OUTPUT_BAK = OUTPUT + "-bak-" + Date.now();

  fs.ensureDirSync(OUTPUT_TMP);

  const watcher = chokidar.watch(INPUT, { cwd: INPUT });
  const queue = async.queue(handle);

  search.init();

  // init search index here...

  queue.drain = function () {
    if (!walked) return;

    if (!moved) {
      fs.moveSync(OUTPUT, OUTPUT_BAK);
      fs.moveSync(OUTPUT_TMP, OUTPUT);
      fs.removeSync(OUTPUT_BAK);
      moved = true;
    }

    if (!options.watch) {
      watcher.close();
    }

    if (!called) {
      called = true;
      search.write(OUTPUT + "/search.json");
      callback();
    }
  };

  watcher
    .on("add", function (path) {
      queue.push({ path, destination: walked ? OUTPUT : OUTPUT_TMP });
    })
    .on("change", function (path) {
      queue.push({ path, destination: walked ? OUTPUT : OUTPUT_TMP });
    })
    .on("ready", function () {
      walked = true;
    });
}

async function handle({ path, destination }, callback) {
  if (path.endsWith(".css")) {
    const CleanCSS = require("clean-css");
    let input = await fs.readFile(join(INPUT, path), "utf-8");
    let output = new CleanCSS().minify(input).styles;
    fs.outputFileSync(join(destination, path), output);
    // merge all css files together into one file
    const cssDir = join(destination, "css");
    const cssFiles = fs
      .readdirSync(cssDir)
      .filter((i) => i.endsWith(".css") && i !== "complete.css");
    const mergedCSS = cssFiles
      .map((i) => fs.readFileSync(join(cssDir, i), "utf-8"))
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
    output = require("./anchor-links")(output);
    output = finder.html_parser(output);
    
    if (path.indexOf('partials/') === -1) {
      output = output + modifiedAndEditLink(INPUT, path);
    }

    // output = require("./minify-html")(output);

    search.add(path, output);

    console.log("html", path);
    await fs.outputFile(join(destination, path), output);
  } else {
    await fs.copy(join(INPUT, path), join(destination, path));
  }
  callback();
}

if (require.main === module) {
  main({ watch: false }, function (err) {
    if (err) throw err;
    process.exit();
  });
}

module.exports = main;
