const config = require("config");
const Express = require("express");
const documentation = new Express();
const hogan = require("helper/express-mustache");
const Cache = require("express-disk-cache");
const cache = new Cache(config.cache_directory);
const fs = require("fs-extra");
const redirector = require("./redirector");
const trace = require("helper/trace");

// Register the engine we will use to
// render the views.
documentation.set("view engine", "html");
documentation.set("views", __dirname + "/../views");
documentation.engine("html", hogan);

if (config.cache === false) {
  // During development we want views to reload as we edit
  documentation.disable("view cache");
} else {
  // This will store responses to disk for NGINX to serve
  documentation.enable("view cache");
  documentation.use(cache);
}

// This is the layout that HBS uses by default to render a
// page. Look into the source, but basically {{{body}}} in
// partials/layout is replaced with the view passed to
// res.render(). You can modify this in the route if needed.
documentation.locals.layout = "partials/layout";
documentation.locals.cacheID = Date.now();
documentation.locals.ip = config.ip;
// Renders dates dynamically in the documentation.
// Can be used like so: {{#date}}MM/YYYY{{/date}}
documentation.locals.date = require("./dates.js");

// Default page title and <meta> description
const { plan } = config.stripe;
documentation.locals.price = "$" + plan.split("_").pop();
documentation.locals.interval = plan.startsWith("monthly") ? "month" : "year";

documentation.get(["/how/format/*"], function (req, res, next) {
  res.locals["show-on-this-page"] = true;
  next();
});
documentation.use(require("./static"));

documentation.use(require("./questions/related"));

documentation.get("/contact", (req, res, next) => {
  res.locals.fullWidth = true;
  next();
});

documentation.get(
  ["/about", "/how/configure", "/templates", "/questions"],
  (req, res, next) => {
    res.locals["hide-on-this-page"] = true;
    next();
  }
);

// Adds a handy 'edit this page' link
documentation.use(
  ["/how", "/templates", "/about"],
  require("./tools/determine-source")
);

documentation.use(require("./selected"));

documentation.get("/", require("./featured"));

documentation.get("/", function (req, res, next) {
  res.locals.layout = "partials/layout-index";
  res.locals.title = "Blot – A blogging platform with no interface.";
  res.locals.description =
    "Turns a folder into a blog automatically. Use your favorite text-editor to write. Text and Markdown files, Word Documents, images, bookmarks and HTML in your folder become blog posts.";
  // otherwise the <title> of the page is 'Blot - Blot'
  res.locals.hide_title_suffix = true;
  next();
});

documentation.use("/fonts", require("./fonts"));

documentation.get("/sitemap.xml", require("./sitemap"));

documentation.use("/templates/developers", require("./developers"));

documentation.use("/about/notes", require("./notes"));

documentation.use("/templates", require("./templates"));

documentation.use("/about/news", require("./news"));

documentation.use("/questions", require("./questions"));

function trimLeadingAndTrailingSlash(str) {
  if (!str) return str;
  if (str[0] === "/") str = str.slice(1);
  if (str[str.length - 1] === "/") str = str.slice(0, -1);
  return str;
}

documentation.use(function (req, res, next) {
  const view = trimLeadingAndTrailingSlash(req.path) || "index";

  if (require("path").extname(view)) {
    console.log("skipping render of", view);
    return next();
  }

  console.log("rendering", view);
  res.render(view);
});

documentation.use((err, req, res, next) => {
  if (err && err.message.startsWith("Failed to lookup view")) return next();
  next(err);
});

// Will redirect old broken links
documentation.use(redirector);

// Missing page
documentation.use(function (req, res, next) {
  // Pass on requests to static files down to app/blog
  // Express application.
  if (req.path.indexOf("/static") === 0) return next();

  res.status(404);
  res.render("error-404");
});

// Some kind of other error
// jshint unused:false
documentation.use(function (err, req, res, next) {
  res.locals.code = { error: true };

  if (config.environment === "development") {
    console.error(err);
    res.locals.err = err;
  }

  res.status(err.status || 500);
  res.render("error");
});

module.exports = documentation;
