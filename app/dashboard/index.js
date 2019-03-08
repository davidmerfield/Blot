var bodyParser = require("body-parser");
var express = require("express");
var debug = require("./debug");
var VIEW_DIRECTORY = __dirname + "/views";
var hbs = require("hbs").create();

// This is the express application used by a
// customer to control the settings and view
// the state of the blog's folder
var dashboard = express();

// Hide the header which says the app is built with Express
dashboard.disable("x-powered-by");

// Without trust proxy is not set, express will incorrectly 
// register the proxy’s IP address as the client's
dashboard.set("trust proxy", "loopback");

// Configure the template engine for the brochure site
hbs.registerPartials(__dirname + "/views/partials");
hbs.registerPartials(__dirname + "/views/folder");

dashboard.set("views", __dirname + "/views");
dashboard.set("view engine", "html");
dashboard.engine("html", hbs.__express);

// For when we want to cache templates
if (process.env.BLOT_ENVIRONMENT !== "development") {
  dashboard.enable("view cache");
}

// Cache ID is used for the static assets
// eventually remove this when you merge
// the assets into a single file
dashboard.locals.cacheID = Date.now();

// Default layout file
dashboard.locals.layout = "partials/wrapper";

// Send static files
dashboard.use("/css", express.static(VIEW_DIRECTORY + "/css"));
dashboard.use("/images", express.static(VIEW_DIRECTORY + "/images"));
dashboard.use("/scripts", express.static(VIEW_DIRECTORY + "/scripts"));

// Log response time in development mode
dashboard.use(debug.init);

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

dashboard.use(require("./util/breadcrumbs"));

dashboard.use(function(req, res, next){
  res.locals.breadcrumbs.add("Your blogs", "/");
  next();
});

dashboard.get("/", require('./util/loadBlogs'), function(req, res, next){
  res.render("index");
});

dashboard.use("/blog/:handle", require('./util/loadBlog'), function(req, res, next){
  res.locals.breadcrumbs.add(req.blog.title, "/blog/" + req.params.handle);
  res.locals.base = "/blog/" + req.params.handle;
  next();
});

// Load the files and folders inside a blog's folder
dashboard.use(require("./routes/folder"));


dashboard.get("/blog/:handle", function(req, res, next){

  res.render("settings");
});

require("./routes/editor")(dashboard);

dashboard.use("/account", require("./routes/account"));



dashboard.use(debug("before loading folder state"));


dashboard.use(debug("after loading folder state"));


require("./routes/tools")(dashboard);



dashboard.use("/blog/:handle", require("./routes/settings"));

dashboard.use(require("./routes/settings/errorHandler"));

// need to handle dashboard errors better...
dashboard.use(require("./routes/error"));

// Restore render function, remove this dumb bullshit eventually
dashboard.use(function(req, res, next) {
  if (res._render) res.render = res._render;
  next();
});

module.exports = dashboard;
