var renderView = require("./render/middleware");
var express = require("express");
var Template = require("models/template");
var Mustache = require("mustache");
var fs = require("fs-extra");

// This serves the content
// of users' blogs
var blog = express();

blog.use((req, res, next) => {
  req.log = req.log || console.log;
  next();
});

// Custom domain & subdomain middleware
// also handles the mapping of preview domains
blog.disable("x-powered-by");
blog.use(require("./vhosts"));
blog.use(require("./add")());

// Only time uncached responses
// if (config.flags.time_response)
//  blog.use(middleware.responseTime);

// Load in the rendering engine
blog.use(renderView);

blog.use(function (req, res, next) {
  // We care about template metadata for template
  // locals. Stuff like page-size is set here.
  // Also global colors etc...

  if (!req.blog.template) return next();

  Template.getMetadata(req.blog.template, function (err, metadata) {
    if (err || !metadata) {
      var error = new Error("This template does not exist.");
      error.code = "NO_TEMPLATE";

      return next(error);
    }

    if (
      req.preview &&
      metadata.errors &&
      Object.keys(metadata.errors).length > 0
    ) {
      const template = fs.readFileSync(
        __dirname + "/views/template-error.html",
        "utf-8"
      );

      const errors = Object.keys(metadata.errors).map(view => {
        return { view, error: metadata.errors[view] };
      });

      const html = Mustache.render(template, {
        errors,
        name: metadata.name,
        path: metadata.localEditing ? "Templates/" + metadata.slug + "/" : ""
      });

      return res.status(500).send(html);
    }

    req.template = {
      locals: metadata.locals,
      id: req.blog.template
    };

    req.log("Loaded template");
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
require("./random")(blog);
require("./error")(blog);

module.exports = blog;
