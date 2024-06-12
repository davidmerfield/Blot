// use npm package 'clean-css' to minify css
const CleanCSS = require("clean-css");
const { join } = require("path");
const fs = require("fs-extra");
const recursiveReadDir = require("helper/recursiveReadDirSync");
const prettySize = require("helper/prettySize");

module.exports = ({source, destination}) => async () => {
  // merge all css files together into one file

  const cssFilePaths = recursiveReadDir(source).filter(i => i.endsWith(".css")); 

  const dashboardFiles = cssFilePaths.filter(i => i.includes("/dashboard/"));
  const documentationFiles = cssFilePaths.filter(i => !dashboardFiles.includes(i));
  
  const documentationCSS = await mergeCSSFiles(documentationFiles);  
  await fs.writeFile(join(destination, "documentation.min.css"), documentationCSS.styles);
  console.log("documentation.min.css built: ", prettySize(documentationCSS.stats.minifiedSize / 1024));

  const dashboardCSS = await mergeCSSFiles(dashboardFiles);
  await fs.writeFile(join(destination, "dashboard.min.css"), dashboardCSS.styles);
  console.log("dashboard.min.css built: ", prettySize(dashboardCSS.stats.minifiedSize / 1024));
}

const mergeCSSFiles = async (files) => {

  const cssContents = await Promise.all(
    files.map(file => fs.readFile(file, "utf-8"))
  );

  const mergedCSS = cssContents.join("\n\n");

  const minifiedCSS = new CleanCSS({ level: 2 }).minify(mergedCSS);

  return minifiedCSS;
}
  