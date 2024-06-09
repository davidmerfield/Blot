// use npm package 'clean-css' to minify css
const CleanCSS = require("clean-css");
const { join } = require("path");
const fs = require("fs-extra");

module.exports = ({source, destination}) => async () => {
  // merge all css files together into one file
  const cssDir = join(source, "css");
  const cssFiles = (await fs.readdir(cssDir)).filter(i => i.endsWith(".css"));

  const cssContents = await Promise.all(
    cssFiles.map(name => fs.readFile(join(cssDir, name), "utf-8"))
  );

  const mergedCSS = cssContents.join("\n\n");
  
  // minimize the css as aggressively as possible
  const minifiedCSS = new CleanCSS({ level: 2 }).minify(mergedCSS).styles;

  await fs.writeFile(join(destination, "css.min.css"), minifiedCSS);
}