const { blot_directory } = require("config");
const fs = require("fs-extra");
const { join } = require("path");
const { build } = require("esbuild");

const documentation_static_files = join(blot_directory, "/app/views");

async function main () {
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
}

if (require.main === module) {
  main();
}

module.exports = main;
