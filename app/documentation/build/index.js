const config = require("config");
const { join, dirname, basename, extname } = require("path");
const { build } = require("esbuild");
const fs = require("fs-extra");
const chokidar = require("chokidar");
const html = require("./html");
const favicon = require("./favicon");
const clfdate = require('helper/clfdate');

const SOURCE_DIRECTORY = join(config.blot_directory, "/app/views");
const DESTINATION_DIRECTORY = join(
  config.blot_directory,
  "/app/documentation/data"
);

const zip = require("templates/folders/zip");
const tools = require("./tools");
const generateThumbnail = require("./generate-thumbnail");

const handle = (initial = false) => async (path) => {
  try {
    
    if (path.includes("tools/") && !initial) {
      await tools();
    } 
    
    if (path.includes("images/examples") && path.endsWith(".png")) {
      await fs.copy(
        join(SOURCE_DIRECTORY, path),
        join(DESTINATION_DIRECTORY, path)
      );
      await generateThumbnail(
        join(SOURCE_DIRECTORY, path),
        join(
          DESTINATION_DIRECTORY,
          dirname(path),
          basename(path, extname(path)) + "-thumb.png"
        )
      );
    } else if (path.endsWith(".html") && !path.includes("dashboard/")) {
      await buildHTML(path);
    } else if (path.endsWith(".css") && !initial) {
      await fs.copy(
        join(SOURCE_DIRECTORY, path),
        join(DESTINATION_DIRECTORY, path)
      );
      await buildCSS();
    } else if (path.endsWith(".js") && !initial) {
      await fs.copy(
        join(SOURCE_DIRECTORY, path),
        join(DESTINATION_DIRECTORY, path)
      );
      await buildJS();
    } else {
      await fs.copy(
        join(SOURCE_DIRECTORY, path),
        join(DESTINATION_DIRECTORY, path)
      );
    }
  } catch (e) {
    console.error(e);
  }
}

module.exports = async ({ watch = false } = {}) => {
  console.time("build");

  await fs.emptyDir(DESTINATION_DIRECTORY);

  await zip();

  await favicon(join(SOURCE_DIRECTORY, "images/logo.svg"), join(DESTINATION_DIRECTORY, "favicon.ico"));

  // recursively read every file in the source directory
  const list = dir => {
    const files = fs.readdirSync(dir);
    return files.reduce((acc, file) => {
      const path = join(dir, file);
      const isDirectory = fs.statSync(path).isDirectory();
      return isDirectory ? [...acc, ...list(path)] : [...acc, path];
    }, []);
  };

  const paths = list(SOURCE_DIRECTORY).map(path =>
    path.slice(SOURCE_DIRECTORY.length + 1)
  );

  const initialHandler = handle(true);

  await Promise.all(paths.map(initialHandler));

  await tools();

  await buildCSS();

  await buildJS();

  console.timeEnd("build");

  const handler = handle();

  if (watch) {
    chokidar
      .watch(SOURCE_DIRECTORY, {
        cwd: SOURCE_DIRECTORY,
        ignoreInitial: true
      })
      .on("all", async (event, path) => {
        if (path) handler(path);
      });
  }
};

async function buildHTML (path) {
  const contents = await fs.readFile(join(SOURCE_DIRECTORY, path), "utf-8");
  const result = await html(contents);

  await fs.outputFile(join(DESTINATION_DIRECTORY, path), result);
}

// use npm package 'clean-css' to minify css
const CleanCSS = require("clean-css");


async function buildCSS () {
  // merge all css files together into one file
  const cssDir = join(SOURCE_DIRECTORY, "css");
  const cssFiles = (await fs.readdir(cssDir)).filter(i => i.endsWith(".css"));

  const cssContents = await Promise.all(
    cssFiles.map(name => fs.readFile(join(cssDir, name), "utf-8"))
  );

  const mergedCSS = cssContents.join("\n\n");
  
  // minimize the css as aggressively as possible
  const minifiedCSS = new CleanCSS({ level: 2 }).minify(mergedCSS).styles;

  await fs.writeFile(join(DESTINATION_DIRECTORY, "css.min.css"), minifiedCSS);
}

async function buildJS () {
  await build({
    entryPoints: [join(SOURCE_DIRECTORY, "js/documentation.js")],
    bundle: true,
    minify: true,
    // sourcemap: true,
    target: ["chrome58", "firefox57", "safari11", "edge16"],
    outfile: join(DESTINATION_DIRECTORY, "documentation.min.js")
  });
  
  console.log('built documentation.min.js');
  
  await build({
    entryPoints: [join(SOURCE_DIRECTORY, "js/dashboard.js")],
    bundle: true,
    minify: true,
    // sourcemap: true,
    target: ["chrome58", "firefox57", "safari11", "edge16"],
    outfile: join(DESTINATION_DIRECTORY, "dashboard.min.js")
  });
  
  console.log('built dashboard.min.js');
}





if (require.main === module) {
  module.exports({ watch: true });
}
