const config = require("config");
const { join } = require("path");
const { build } = require("esbuild");
const fs = require("fs-extra");
const chokidar = require("chokidar");
const cheerio = require("cheerio");
const SOURCE_DIRECTORY = join(config.blot_directory, "/app/views");
const DESTINATION_DIRECTORY = join(
  config.blot_directory,
  "/app/documentation/data"
);
const zip = require("templates/folders/zip");

async function handle (path) {
  try {
    if (path.endsWith(".html") && !path.includes("dashboard/")) {
      await buildHTML(path);
    } else if (path.endsWith(".css")) {
      await fs.copy(
        join(SOURCE_DIRECTORY, path),
        join(DESTINATION_DIRECTORY, path)
      );
      await buildCSS();
    } else if (path.endsWith(".js")) {
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
  } catch (e) {}
}

module.exports = async ({ watch = false } = {}) => {
  await fs.emptyDir(DESTINATION_DIRECTORY);

  // zip the templates for production
  if (config.environment === "production") await zip();

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

  await Promise.all(paths.map(handle));

  if (watch) {
    chokidar
      .watch(SOURCE_DIRECTORY, {
        cwd: SOURCE_DIRECTORY,
        ignoreInitial: true
      })
      .on("all", async (event, path) => {
        if (path) handle(path);
      });
  }
};

async function buildHTML (path) {
  const transformers = [
    require("../tools/typeset"),
    require("../tools/anchor-links"),
    require("../tools/tex"),
    require("../tools/finder").html_parser
  ];

  const html = await fs.readFile(join(SOURCE_DIRECTORY, path), "utf-8");

  // we want to remove any indentation before the partial tag {{> body}}

  if (html.includes("{{> body}}")) {
    const lines = html.split("\n");
    const result = lines
      .map(i => {
        if (!i.includes("{{> body}}")) return i;
        if (i.trim().startsWith("{{> body}}")) return i.trim();
      })
      .join("\n");

    await fs.outputFile(join(DESTINATION_DIRECTORY, path), result);

    return;
  }

  const $ = cheerio.load(html, { decodeEntities: false });

  for (const transformer of transformers) {
    transformer($);
  }

  let result = $.html();

  // remove the indent from the line which contains the body partial
  // this prevents issues with code snippets
  if (result.includes("{{> body}}")) {
    const lines = result.split("\n");
    const index = lines.findIndex(line => line.includes("{{> body}}"));
    lines[index] = lines[index].trim();
    result = lines.join("\n");
  }

  await fs.outputFile(join(DESTINATION_DIRECTORY, path), result);
}

async function buildCSS () {
  // merge all css files together into one file
  const cssDir = join(SOURCE_DIRECTORY, "css");
  const cssFiles = (await fs.readdir(cssDir)).filter(i => i.endsWith(".css"));
  const cssContents = await Promise.all(
    cssFiles.map(name => fs.readFile(join(cssDir, name), "utf-8"))
  );

  const mergedCSS = cssContents.join("\n\n");

  await fs.writeFile(join(DESTINATION_DIRECTORY, "style.min.css"), mergedCSS);
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
}
