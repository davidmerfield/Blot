var renderView = require("./render/middleware");
var express = require("express");
var config = require("config");
var compression = require("compression");
var cache = require("express-disk-cache")(config.cache_directory);
var Template = require("template");

// This serves the content
// of users' blogs
var blog = express();

// Custom domain & subdomain middleware
// also handles the mapping of preview domains
blog
  .disable("x-powered-by")
  .use(compression())
  .use(require("./vhosts"))
  .use(require("./add")());

if (config.cache) blog.use(cache);

// Only time uncached responses
// if (config.flags.time_response)
//  blog.use(middleware.responseTime);

// Load in the rendering engine
blog.use(renderView);

blog.use(function(req, res, next) {
  // We care about template metadata for template
  // locals. Stuff like page-size is set here.
  // Also global colors etc...

  if (!req.blog.template) return next();

  Template.getMetadata(req.blog.template, function(err, metadata) {
    if (err || !metadata) {
      var error = new Error("This template does not exist.");
      error.code = "NO_TEMPLATE";

      return next(error);
    }

    req.template = {
      locals: metadata.locals,
      id: req.blog.template
    };

    return next();
  });
});

// The order of these routes is important
require("./draft")(blog);
require("./tagged")(blog);
require("./search")(blog);
require("./robots")(blog);
require("./view")(blog);
require("./entry")(blog);
require("./entries")(blog);
blog.use(require("./assets"));
require("./public")(blog);
require("./error")(blog);

module.exports = blog;
