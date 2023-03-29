const fs = require("fs-extra");
const MinifyJS = require("uglify-js");
const MinifyCSS = require("clean-css");
const MinifyHTML = require("html-minifier");

module.exports = async function (options, callback) {
  const { path, content_type, minify = false } = options;

  if (!minify) return callback();

  try {
    if (content_type.includes("text/html")) {
      await minifyHTML(path);
    } else if (content_type.includes("text/css")) {
      await minifyCSS(path);
    } else if (content_type.includes("/javascript")) {
      await minifyJS(path);
    } else {
      // No processor for content_type
    }
  } catch (e) {
    // Failed to minify but whatever
  }

  callback();
};

async function minifyHTML(path) {
  const { minify } = MinifyHTML;
  const input = await fs.readFile(path, "utf-8");

  var options = {
    // Omit attribute values from boolean attributes
    collapseBooleanAttributes: true,
    // Collapse white space that contributes to text nodes in a document tree
    collapseWhitespace: true,
    // Use direct Unicode characters whenever possible
    decodeEntities: true,
    // Minify CSS in style elements and style attributes (uses clean-css)
    minifyCSS: true,
    // Minify JavaScript in script elements and event attributes (uses UglifyJS)
    minifyJS: true,
    // Minify URLs in various attributes (uses relateurl)
    minifyURLs: true,
    // Strip HTML comments
    removeComments: true,
    // Remove all attributes with whitespace-only values
    removeEmptyAttributes: true,
    // Remove quotes around attributes when possible
    removeAttributeQuotes: true,
    // Sort attributes by frequency
    // won't impact the plain-text size of the output
    // should improve compression ratio of gzip
    sortAttributes: true,
    // Sort style classes by frequency
    // won't impact the plain-text size of the output
    // should improve compression ratio of gzip
    sortClassName: true,
  };

  const output = minify(input, options);

  await fs.outputFile(path, output, "utf-8");

  return path;
}

async function minifyJS(path) {
  const { minify } = MinifyJS;
  const input = await fs.readFile(path, "utf-8");
  const output = minify(input, { fromString: true }).code;
  await fs.outputFile(path, output, "utf-8");
  return path;
}

async function minifyCSS(path) {
  const minimize = new MinifyCSS();
  const input = await fs.readFile(path, "utf-8");
  const output = minimize.minify(input).styles;
  await fs.outputFile(path, output);
  return path;
}
