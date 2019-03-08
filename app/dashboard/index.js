var bodyParser = require("body-parser");
var hogan = require("hogan-express");
var express = require("express");
var debug = require("./debug");
var VIEW_DIRECTORY = __dirname + "/views";

// This is the express application used by a
// customer to control the settings and view
// the state of the blog's folder
var dashboard = express();

// Send static files
dashboard.use("/css", express.static(VIEW_DIRECTORY + "/css"));
dashboard.use("/images", express.static(VIEW_DIRECTORY + "/images"));
dashboard.use("/scripts", express.static(VIEW_DIRECTORY + "/scripts"));

// Log response time in development mode
dashboard.use(debug.init);

// Hide the header which says the app
// is built with Express
dashboard.disable("x-powered-by");

// Without trust proxy is not set, express
//  will incorrectly register the proxy’s IP address
// as the client IP address unless trust proxy is configured.
dashboard.set("trust proxy", "loopback");

// Register the engine we will use to
// render the views.
dashboard.set("view engine", "html");
dashboard.set("views", VIEW_DIRECTORY);
dashboard.engine("html", hogan);

// For when we want to cache templates
if (process.env.BLOT_ENVIRONMENT !== "development") {
  dashboard.enable("view cache");
}

// Cache ID is used for the static assets
// eventually remove this when you merge
// the assets into a single file
dashboard.locals.cacheID = Date.now();

// Special function which wraps redirect
// so I can pass messages between views cleanly
dashboard.use("/clients", require("./routes/clients"));

dashboard.use("/stripe-webhook", require("./routes/stripe_webhook"));

dashboard.get("/logged-out", function(req, res, next) {
  res.locals.partials = {};
  res.locals.partials.yield = "logged-out";
  res.render("partials/wrapper-public");
});

dashboard.get("/deleted", function(req, res, next) {
  res.locals.partials = {};
  res.locals.partials.yield = "deleted";
  res.render("partials/wrapper-public");
});

/// EVERYTHING AFTER THIS NEEDS TO BE AUTHENTICATED
dashboard.use(debug("fetching user and blog info and checking redirects"));
dashboard.use(require("../session"));
dashboard.use(function(req, res, next) {
  if (req.session && req.session.uid) return next();

  return next(new Error("NOUSER"));
});

dashboard.use(require("./message"));

// Appends a one-time CSRF-checking token
// for each GET request, and validates this token
// for each POST request, using csurf.
dashboard.use(require("./csrf"));

// Load properties as needed
// these should not be invoked for requests to static files
dashboard.use(require("./util/loadUser"));
dashboard.use(require("./util/loadBlogs"));

// Performs some basic checks about the
// state of the user's blog, user's subscription
// and shuttles the user around as needed
dashboard.use(require("./redirector"));

// Send user's avatar
dashboard.use("/_avatars/:avatar", require("./util/serveAvatar"));

dashboard.post(
  [
    "/settings/theme*",
    "/path",
    "/folder*",
    "/settings/client*",
    "/flags",
    "/404s",
    "/account*"
  ],
  bodyParser.urlencoded({ extended: false })
);


dashboard.use(function(req, res, next) {
  res.locals.partials = res.locals.partials || {};

  res.locals.links_for_footer = [];

  res.locals.footer = function() {
    return function(text, render) {
      res.locals.links_for_footer.push({ html: text });
      return "";
    };
  };

  next();
});


require("./routes/editor")(dashboard);

// Special function which wraps render so there is a default layout and a partial
// inserted into it
dashboard.use(require("./render"));

dashboard.use("/account", require("./routes/account"));

dashboard.use(debug("before loading folder state"));

// Load the files and folders inside a blog's folder
dashboard.use(require("./routes/folder"));

dashboard.get("/folder", function(req, res, next) {
  res.render("folder", { selected: { folder: "selected" } });
});

dashboard.use(debug("after loading folder state"));

dashboard.use(require("./util/breadcrumbs"));

require("./routes/tools")(dashboard);

dashboard.use(require("./routes/settings"));

dashboard.use(require("./routes/settings/errorHandler"));

// need to handle dashboard errors better...
dashboard.use(require("./routes/error"));

// Restore render function, remove this dumb bullshit eventually
dashboard.use(function(req, res, next) {
  if (res._render) res.render = res._render;
  next();
});

module.exports = dashboard;
