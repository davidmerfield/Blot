var Transformer = require("helper").transformer;
var debug = require("debug")("blot:entry:build:plugins:image");
var eachEl = require("../eachEl");
var optimize = require("./optimize");
var url = require("url");

function render($, callback, options) {
  var blogID = options.blogID;
  var cache = new Transformer(blogID, "image-cache");

  // Process 5 images concurrently
  eachEl(
    $,
    "img",
    function(el, next) {
      var src = $(el).attr("src");
      var width, height, parsedSrc;

      try {
        // Test for query string to skip caching & optimizing
        parsedSrc = url.parse(src, { parseQueryString: true });
        debug(src, "parsed into", parsedSrc);
      } catch (e) {
        return next();
      }

      // We want to allow you to opt out of image caching We do not
      // cache images with the static query e.g. /image.jpg?static=1
      if (parsedSrc && parsedSrc.query && parsedSrc.query.static) {
        debug(src, "Image has 'static' URL param, skipping");
        return next();
      }

      // Pass in the `pathname` component of the image src (no URL params or hash)
      cache.lookup(src, optimize(blogID), function(err, info) {
        if (err) {
          debug(src, "Optimize failed with Error:", err);
          return next();
        }

        // Replace the image's source with the new
        // source, which is a path to an image in the
        // static assets folder for this blog.
        $(el).attr("src", info.src);

        // Now we will attempt to declare the width and
        // height of the image to speed up page loads...
        if ($(el).attr("width") || $(el).attr("height")) {
          debug(src, "El has width or height pre-specified dont modify");
          return next();
        }

        width = info.width;
        height = info.height;

        // This is a retina image so halve its dimensions
        if ($(el).attr("data-2x") || isRetina(src)) {
          debug(src, "retinafying the dimensions");
          height /= 2;
          width /= 2;
        }

        $(el)
          .attr("width", width)
          .attr("height", height);

        debug(src, "complete!");
        next();
      });
    },
    function() {
      debug("Invoking callback now!");
      callback();
    }
  );
}

function isRetina(url) {
  return url && url.toLowerCase && url.toLowerCase().indexOf("@2x") > -1;
}

module.exports = {
  render: render,
  category: "images",
  title: "Cache",
  description: "Cache and optimize images"
};
