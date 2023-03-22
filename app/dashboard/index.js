var bodyParser = require("body-parser");
var hogan = require("helper/express-mustache");
var express = require("express");
var trace = require("helper/trace");
const root = require("helper/rootDir");
const { join } = require("path");
var VIEW_DIRECTORY = join(root, "app/views/dashboard");
var config = require("config");

console.log(VIEW_DIRECTORY);

// This is the express application used by a
// customer to control the settings and view
// the state of the blog's folder
var dashboard = express();

// Send static files
dashboard.use(
  "/css",
  express.static(VIEW_DIRECTORY + "/css", { maxAge: 86400000 })
);
dashboard.use(
  "/images",
  express.static(VIEW_DIRECTORY + "/images", { maxAge: 86400000 })
);
dashboard.use(
  "/scripts",
  express.static(VIEW_DIRECTORY + "/scripts", { maxAge: 86400000 })
);

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

const { plan } = config.stripe;
dashboard.locals.price = "$" + plan.split("_").pop();
dashboard.locals.interval = plan.startsWith("monthly") ? "month" : "year";

dashboard.locals.cdn = () => (text, render) =>
  `${config.cdn.origin}/documentation${render(
    text
  )}?cacheID=${Date.now()}&extension=${require("path").extname(text)}`;

// For when we want to cache templates
if (config.environment !== "development") {
  dashboard.enable("view cache");
}

// Cache ID is used for the static assets
// eventually remove this when you merge
// the assets into a single file
dashboard.locals.cacheID = Date.now();
dashboard.locals.layout = "partials/wrapper";

dashboard.use(trace("loading session information"));
dashboard.use(require("./session"));
dashboard.use(trace("loaded session information"));

// Appends a one-time CSRF-checking token
// for each GET request, and validates this token
// for each POST request, using csurf.
dashboard.use(require("./csrf"));

dashboard.use("/sign-up", require("./routes/sign-up"));
dashboard.use("/log-in", require("./routes/log-in"));

/// EVERYTHING AFTER THIS NEEDS TO BE AUTHENTICATED
dashboard.use(function (req, res, next) {
  if (req.session && req.session.uid) {
    return next();
  }

  next(new Error("NOUSER"));
});

dashboard.use(require("./message"));

dashboard.use(trace("loading user"));
dashboard.use(require("./load-user"));
dashboard.use(trace("loaded user"));

dashboard.use(trace("loading blog"));
dashboard.param("handle", require("./load-blog"));
dashboard.use(trace("loaded blog"));

// Performs some basic checks about the
// state of the user's blog, user's subscription
// and shuttles the user around as needed
dashboard.use(trace("checking redirects"));
dashboard.use(require("./redirector"));
dashboard.use(trace("checked redirects"));

dashboard.use(require("./breadcrumbs"));

// This needs to be before ':handle'
dashboard.use("/account", require("./routes/account"));

// Redirect old URLS
dashboard.use("/settings", require("./load-blogs"), function (req, res, next) {
  try {
    const redirect = `/dashboard/${req.blogs[0].handle}${req.path}`;
    res.redirect(redirect);
  } catch (e) {
    next();
  }
});

dashboard.get("/account/logged-out", function (req, res) {
  res.sendFile(VIEW_DIRECTORY + "/dashboard/account/logged-out.html");
});

dashboard.use("/account", function (req, res, next) {
  // we don't want search engines indexing these pages
  // since they're /logged-out, /disabled and
  res.set("X-Robots-Tag", "noindex");
  next();
});

// Send user's avatar
dashboard.use("/_avatars/:avatar", require("./routes/avatar"));

// We need to be able to send CSS files through the
// template editor and they sometimes include base64 stuff.
const MAX_POST_REQUEST_SIZE = "5mb";

dashboard.post(
  [
    "/:handle/template*",
    "/:handle/client",
    "/:handle/client/switch",
    "/path",
    "/folder*",
    "/settings/client*",
    "/flags",
    "/404s",
    "/account*",
  ],
  bodyParser.urlencoded({ extended: false, limit: MAX_POST_REQUEST_SIZE })
);

// Account page does not need to know about the state of the folder
// for a particular blog
dashboard.use(function (req, res, next) {
  res.locals.links_for_footer = [];
  res.locals.footer = function () {
    return function (text) {
      res.locals.links_for_footer.push({ html: text });
      return "";
    };
  };

  next();
});

dashboard.use("/:handle", function (req, res, next) {
  // we use pretty.label instead of title for title-less blogs
  // this falls back to the domain of the blog if no title exists
  res.locals.base = `/dashboard/${req.params.handle}`;
  res.locals.breadcrumbs.add("Your blogs", "/dashboard");
  res.locals.breadcrumbs.add(req.blog.pretty.label, `${req.params.handle}`);
  res.locals.title = req.blog.pretty.label;
  next();
});

// Use this before modifying the render function
// since it doesn't use the layout for the rest of the dashboard
dashboard.use("/:handle/template/edit", require("./routes/template-editor"));

// Will deliver the sync status of the blog as SSEs
dashboard.use("/:handle/status", require("./routes/status"));

dashboard.get("/", require("./load-blogs"), function (req, res) {
  res.locals.title = "Your blogs";
  res.locals.breadcrumbs.add("Your blogs", "/dashboard");
  res.render("index");
});

// Load the files and folders inside a blog's folder
dashboard.get(
  "/:handle/folder/:path(*)",

  function (req, res, next) {
    req.folderPath = "/" + req.params.path;
    next();
  },

  require("./routes/folder"),

  function (req, res) {
    res.render("folder", { selected: { folder: "selected" } });
  }
);

dashboard.get("/:handle", require("./routes/folder"));
dashboard.use("/:handle/services/import", require("./routes/import"));
dashboard.use("/:handle", require("./routes/settings"));

// This will catch old links to the dashboard before
// we encoded the blog's username in the URLs
dashboard.use(require("./redirect-to-other-blog"));

// need to handle dashboard errors better...
dashboard.use(require("./routes/settings/errorHandler"));

dashboard.use(function (req, res, next) {
  const err = new Error("Page not found");
  err.status = 404;
  next(err);
});

// Some kind of other error
// jshint unused:false
dashboard.use(function (err, req, res, next) {
  // If the user is not logged in, we sent them to the documentation
  if (err.message === "NOUSER") {
    let from;
    try {
      let referrer = require("url").parse(req.get("Referrer"));
      if (referrer.host === config.host) from = referrer.path;
    } catch (e) {}

    return res.redirect(
      "/log-in?then=" + req.originalUrl + (from ? "&from=" + from : "")
    );
  }

  const status = err.status || 500;

  if (config.environment === "development") {
    res.locals.error = {
      stack: err.stack,
    };
  }

  res.locals.layout = "";
  res.status(status);
  console.log("HERE!", res.locals);
  res.render("error");
});
module.exports = dashboard;
