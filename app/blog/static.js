var Express = require("express");
var static = new Express.Router();
var Blog = require("blog");
var config = require("config");
var mime = require("mime-types");

static.use(function(req, res, next){
  
  if (req.get("host") === config.host) return next();
  
  var err;

  err = new Error("Not a request to main host");
  err.code = 'EINVAL';

  next(err);
});

static.param("handle", function(req, res, next, handle) {
  Blog.get({ handle: handle }, function(err, blog) {
    if (err) return next(err);
    if (!blog) return next(new Error("No blog"));

    req.blog = blog;
    next();
  });
});

static.route("/:handle/:path*").get(function(req, res) {
  var path = req.params.path + req.params[0];
  var options = {
    root: config.blog_static_files_dir + "/" + req.blog.id,
    maxAge: 86400000,
    headers: {
      "Content-Type": getContentType(path)
    }
  };

  res.sendFile(path, options, function(err) {
    if (err) {
      res.sendStatus(404);
    }
  });
});

static.use(function(req, res, next) {
  res.sendStatus(404);
});

static.use(function(err, req, res, next) {

  if (err.code === 'EINVAL') return next();
  
  res.sendStatus(404);
});

function getContentType(path) {
  // If we can't determine a mime type for a given path,
  // assume it is HTML if we are responding to a request
  // for a directory, or an octet stream otherwise...
  var default_mime =
    path.indexOf(".") > -1 ? "application/octet-stream" : "text/html";

  return mime.contentType(mime.lookup(path) || default_mime);
}

module.exports = static;
