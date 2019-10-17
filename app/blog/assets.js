var config = require("config");
var mime = require("mime-types");
var async = require("async");
var debug = require("debug")("blot:blog:assets");

var LARGEST_POSSIBLE_MAXAGE = 86400000;

module.exports = function(req, res, next) {
  var paths,
    roots,
    candidates = [];

  // Not sure if or how this can happen
  if (!req.path) return next();

  // We check to see if the requests path
  // matches a file in the following directories
  roots = [
    // Blog directory /blogs/$id
    { root: config.blog_folder_dir + "/" + req.blog.id },

    // Static directory /static/$id
    {
      root: config.blog_static_files_dir + "/" + req.blog.id,
      maxAge: LARGEST_POSSIBLE_MAXAGE
    },

    // Global static directory
    {
      root: __dirname + "/static",
      maxAge: LARGEST_POSSIBLE_MAXAGE
    }
  ];

  // decodeURIComponent maps something like
  // "/Hello%20World.txt" to "/Hello World.txt"
  // Express does not do this for us.
  paths = [
    // First we try the actual path
    decodeURIComponent(req.path),

    // Then the lowercase path
    decodeURIComponent(req.path).toLowerCase(),

    // Finally the path plus an index file
    withoutTrailingSlash(decodeURIComponent(req.path)) + "/index.html"
  ];

  roots.forEach(function(options) {
    paths.forEach(function(path) {
      var headers = {
        "Content-Type": getContentType(path)
      };

      if (!options.maxAge) {
        headers["Cache-Control"] = "no-cache";
      }

      candidates.push({
        options: {
          root: options.root,
          maxAge: options.maxAge || 0,
          headers: headers
        },
        path: path
      });
    });
  });

  candidates = candidates.map(function(candidate) {
    return function(next) {
      debug("Attempting", candidate);
      res.sendFile(candidate.path, candidate.options, next);
    };
  });

  async.tryEach(candidates, function(err) {
    // Is this still neccessary?
    if (res.headersSent) return;

    // hide the error, keep on going
    if (err) return next();
  });
};

function withoutTrailingSlash(path) {
  if (!path || !path.length) return path;
  if (path.slice(-1) === "/") return path.slice(0, -1);
  return path;
}

function getContentType(path) {
  // If we can't determine a mime type for a given path,
  // assume it is HTML if we are responding to a request
  // for a directory, or an octet stream otherwise...
  var default_mime =
    path.indexOf(".") > -1 ? "application/octet-stream" : "text/html";

  return mime.contentType(mime.lookup(path) || default_mime);
}
