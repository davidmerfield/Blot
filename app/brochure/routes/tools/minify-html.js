var minify = require("html-minifier").minify;

module.exports = function render_tex(req, res, next) {
  var send = res.send;

  res.send = function(string) {
    var html = string instanceof Buffer ? string.toString() : string;
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
      sortClassName: true
    };

    try {
      send.call(this, minify(html, options));
    } catch (e) {
      console.error("Error: Failed to minify HTML for", req.originalUrl);
      send.call(this, html);
    }
  };

  next();
};
