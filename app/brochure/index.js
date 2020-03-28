var config = require("config");
var Express = require("express");
var brochure = new Express();
var hbs = require("hbs");
var Cache = require("express-disk-cache");
var cache = new Cache(config.cache_directory);
var warmCache = require("./warmCache");

// Configure the template engine for the brochure site
hbs.registerPartials(__dirname + "/views/partials");
brochure.set("views", __dirname + "/views");
brochure.set("view engine", "html");
brochure.engine("html", hbs.__express);

if (config.cache === false) {
  // During development we want views to reload as we edit
  brochure.disable("view cache");
} else {
  // This will store responses to disk for NGINX to serve
  brochure.use(cache);

  // Empty any existing responses
  cache.flush(config.host, function(err) {
    if (err) console.warn(err);
    setTimeout(function() {
      console.log("Warming cache...");
      warmCache(config.protocol + config.host, function(err) {
        if (err) console.warn(err);
        console.log("Warmed cache");
      });
    }, 10 * 1000);
  });
}

// This is the layout that HBS uses by default to render a
// page. Look into the source, but basically {{{body}}} in
// partials/layout is replaced with the view passed to
// res.render(). You can modify this in the route if needed.
brochure.locals.layout = "layout";
brochure.locals.cacheID = Date.now();

// Default page title and <meta> description
brochure.locals.title = "Blot – A blogging platform with no interface.";
brochure.locals.description =
  "Turns a folder into a blog automatically. Use your favorite text-editor to write. Text and Markdown files, Word Documents, images, bookmarks and HTML in your folder become blog posts.";

brochure.locals.price = "$" + config.stripe.plan.split("_").pop();
brochure.locals.interval =
  config.stripe.plan.indexOf("monthly") === 0 ? "month" : "year";

brochure.use(function(req, res, next) {
  if (
    req.user &&
    req.user.subscription &&
    req.user.subscription.plan &&
    req.user.subscription.plan.amount
  ) {
    res.locals.price = "$" + req.user.subscription.plan.amount / 100;
  }

  next();
});

// Now we actually load the routes for the brochure website.
brochure.use(require("./routes"));

brochure.use(
  Express.static(__dirname + "/views", {
    // maxAge: 86400000
  })
);

// Redirect user to dashboard for these links
brochure.use(["/account", "/settings"], function(req, res, next) {
  return res.redirect("/log-in?then=" + req.originalUrl);
});

// Missing page
brochure.use(function(req, res, next) {
  // Pass on requests to static files down to app/blog
  // Express application.
  if (req.path.indexOf("/static") === 0) return next();

  var err = new Error("404: " + req.originalUrl);
  err.status = 404;
  next(err);
});

// Some kind of other error
brochure.use(function(err, req, res, next) {
  if (err.status === 404) {
    res.locals.code = { missing: true };
  } else {
    res.locals.code = { error: true };
  }

  if (config.environment === "development") {
    console.error(err);
    res.locals.err = err;
  }

  res.status(err.status || 500);
  res.locals.layout = "/partials/layout-focussed.html";
  res.render("error");
});

module.exports = brochure;
