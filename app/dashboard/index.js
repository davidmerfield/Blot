var bodyParser = require("body-parser");
var hogan = require("hogan-express");
var express = require("express");
var trace = require("helper/trace");
var VIEW_DIRECTORY = __dirname + "/views";
var config = require("config");

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

// For when we want to cache templates
if (config.environment !== "development") {
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

/// EVERYTHING AFTER THIS NEEDS TO BE AUTHENTICATED
dashboard.use(trace("loading session information"));
dashboard.use(require("./session"));
dashboard.use(function (req, res, next) {
  if (req.session && req.session.uid) {
    return next();
  }

  return next(new Error("NOUSER"));
});
dashboard.use(trace("loaded session information"));

dashboard.use(require("./message"));

// Appends a one-time CSRF-checking token
// for each GET request, and validates this token
// for each POST request, using csurf.
dashboard.use(require("./csrf"));

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

// Send user's avatar
dashboard.use("/_avatars/:avatar", require("./routes/avatar"));

dashboard.post(
  [
    "/dashboard/:handle/template*",
    "/dashboard/:handle/client",
    "/path",
    "/folder*",
    "/settings/client*",
    "/flags",
    "/404s",
    "/account*",
  ],
  bodyParser.urlencoded({ extended: false })
);

// Account page does not need to know about the state of the folder
// for a particular blog
dashboard.use(function (req, res, next) {
  res.locals.links_for_footer = [];
  res.locals.partials = res.locals.partials || {};

  res.locals.footer = function () {
    return function (text) {
      res.locals.links_for_footer.push({ html: text });
      return "";
    };
  };

  next();
});

dashboard.use(require("./breadcrumbs"));

dashboard.use("/dashboard/:handle", function (req, res, next) {
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
dashboard.use(
  "/dashboard/:handle/template/edit",
  require("./routes/template-editor")
);

// Will deliver the sync status of the blog as SSEs
dashboard.use("/dashboard/:handle/status", require("./routes/status"));

// Special function which wraps render
// so there is a default layout and a partial
dashboard.use(require("./render"));

dashboard.use("/account", require("./routes/account"));

dashboard.get("/dashboard", require("./load-blogs"), function (req, res, next) {
  res.locals.title = "Your blogs";
  res.render("index");
});

// Load the files and folders inside a blog's folder
dashboard.get(
  "/dashboard/:handle/folder/:path(*)",

  function (req, res, next) {
    req.folderPath = "/" + req.params.path;
    next();
  },

  require("./routes/folder"),

  function (req, res) {
    res.render("folder", { selected: { folder: "selected" } });
  }
);

dashboard.get("/dashboard/:handle", require("./routes/folder"));
dashboard.use("/dashboard/:handle", require("./routes/settings"));

// Redirect old URLS
dashboard.use("/settings", require("./load-blogs"), function (req, res, next) {
  try {
    const redirect = `/dashboard/${req.blogs[0].handle}${req.path}`;
    res.redirect(redirect);
  } catch (e) {
    next();
  }
});

// This will catch old links to the dashboard before
// we encoded the blog's username in the URLs
dashboard.use(require("./redirect-to-other-blog"));

// need to handle dashboard errors better...
dashboard.use(require("./routes/settings/errorHandler"));
dashboard.use(require("./routes/error"));

// Restore render function, remove this dumb bullshit eventually
dashboard.use(function (req, res, next) {
  if (res._render) res.render = res._render;
  next();
});

module.exports = dashboard;
