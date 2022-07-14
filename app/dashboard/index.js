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
    "/settings/template*",
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
    return function (text, render) {
      res.locals.links_for_footer.push({ html: text });
      return "";
    };
  };

  next();
});

// Use this before modifying the render function
// since it doesn't use the layout for the rest of the dashboard
dashboard.use("/template-editor", require("./routes/template-editor"));

// Will deliver the sync status of the blog as SSEs
dashboard.use("/status", require("./routes/status"));

// Special function which wraps render
// so there is a default layout and a partial
// inserted into it
dashboard.use(require("./render"));

dashboard.use(function (req, res, next) {
  res.locals.breadcrumbs = new Breadcrumbs();
  next();
});

dashboard.use("/account", require("./routes/account"));

dashboard.use(function (req, res, next) {
  res.locals.breadcrumbs.add("Your blogs", "/dashboard");
  next();
});

dashboard.get("/dashboard", require("./load-blogs"), function (req, res, next) {
  res.locals.title = "Your blogs";
  res.render("index");
});

dashboard.use("/dashboard/:handle", function (req, res, next) {
  // we use pretty.label instead of title for title-less blogs
  // this falls back to the domain of the blog if no title exists
  res.locals.base = `/dashboard/${req.params.handle}`;
  res.locals.breadcrumbs.add(req.blog.pretty.label, `${req.params.handle}`);
  res.locals.title = req.blog.pretty.label;
  next();
});

// Load the files and folders inside a blog's folder
dashboard.get(
  "/dashboard/:handle/folder/:path*",
  
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

function Breadcrumbs() {
  var list = [];

  list.add = function (label, slug) {
    var base = "/";

    if (list.length) base = list[list.length - 1].url;

    list.push({ label: label, url: require("path").join(base, slug) });

    for (var i = 0; i < list.length; i++) {
      list[i].first = i === 0;
      list[i].last = i === list.length - 1;
      list[i].only = i === 0 && list.length === 1;
    }
  };

  return list;
}

dashboard.use("/dashboard/:handle", require("./routes/settings"));

dashboard.use(require("./routes/settings/errorHandler"));

// need to handle dashboard errors better...
dashboard.use(require("./routes/error"));

// Restore render function, remove this dumb bullshit eventually
dashboard.use(function (req, res, next) {
  if (res._render) res.render = res._render;
  next();
});

module.exports = dashboard;
