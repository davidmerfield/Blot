var hogan = require("helper/express-mustache");
var trace = require("helper/trace");
const root = require("helper/rootDir");
const { join } = require("path");
var VIEW_DIRECTORY = join(root, "app/documentation/data/dashboard");
var config = require("config");
const { static } = require("express");
var express = require("express");
const message = require("./message");
const hash = require("helper/hash");
const fs = require("fs");
const { blot_directory } = require("config");

// This is the express application used by a
// customer to control the settings and view
// the state of the blog's folder
var dashboard = express();

// Hide the header added by Express
dashboard.disable("x-powered-by");

// Without trust proxy is not set, express
//  will incorrectly register the proxy’s IP address
// as the client IP address unless trust proxy is configured.
// Trusts secure requests terminated by NGINX, as far as I know
dashboard.set("trust proxy", ["loopback", ...config.reverse_proxies]);

// Register the engine we will use to
// render the views.
dashboard.set("view engine", "html");
dashboard.set("views", VIEW_DIRECTORY);
dashboard.engine("html", hogan);

const { plan } = config.stripe;
dashboard.locals.price = "$" + plan.split("_").pop();
dashboard.locals.interval = plan.startsWith("monthly") ? "month" : "year";

const cacheID = Date.now();

dashboard.locals.cdn = () => (text, render) => {
  const path = render(text);
  const extension = path.split(".").pop();

  let identifier = "cacheID=" + cacheID;

  try {
    const contents = fs.readFileSync(
      join(blot_directory, "/app/views", path),
      "utf8"
    );
    identifier = "hash=" + hash(contents);
  } catch (e) {
    // if the file doesn't exist, we'll use the cacheID
  }

  const query = `?${identifier}&ext=.${extension}`;
  const url = `${path}${query}`;

  return url;
};

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

// These need to be accessible to unauthenticated users
dashboard.use("/sign-up", require("./sign-up"));
dashboard.use("/log-in", require("./log-in"));

var logout = require("dashboard/account/util/logout");

dashboard.get("/disabled", logout, (req, res) => {
  res.locals.layout = "partials/layout-form";
  res.render("disabled");
});

dashboard.get("/deleted", logout, (req, res) => {
  res.locals.layout = "partials/layout-form";
  res.render("deleted");
});

// Everything afterwards should be authenticated
dashboard.use(function (req, res, next) {
  if (req.session && req.session.uid) {
    return next();
  }

  next(new Error("NOUSER"));
});

dashboard.use(message.middleware);

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

dashboard.use("/stats", require("./stats"));

// These need to be before ':handle'
dashboard.use("/account", require("./account"));

dashboard.use(
  "/share-template",
  require("./load-blogs"),
  require("./share-template")
);

// Redirect old URLS
dashboard.use("/settings", require("./load-blogs"), function (req, res, next) {
  try {
    const redirect = `/dashboard/${req.blogs[0].handle}${req.path}`;
    res.redirect(redirect);
  } catch (e) {
    next();
  }
});

dashboard.use("/account", function (req, res, next) {
  // we don't want search engines indexing these pages
  // since they're /logged-out, /disabled and
  res.set("X-Robots-Tag", "noindex");
  next();
});

// Send user's avatar
dashboard.use("/_avatars/:avatar", require("./avatar"));

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
dashboard.use("/:handle/template/edit", require("./template-editor"));

// Will deliver the sync status of the blog as SSEs
dashboard.use("/:handle/status", require("./status"));

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
  require("./folder"),
  function (req, res) {
    res.render("folder", { selected: { folder: "selected" } });
  }
);

dashboard.get("/:handle", require("./folder"));
dashboard.use("/:handle/services/import", require("./import"));
dashboard.use("/:handle", require("./settings"));

// This will catch old links to the dashboard before
// we encoded the blog's username in the URLs
dashboard.use(require("./redirect-to-other-blog"));

// need to handle dashboard errors better...
dashboard.use(message.errorHandler);

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

    res.clearCookie("signed_into_blot", { domain: "", path: "/" });
    return res.redirect(
      "/log-in?then=" + req.originalUrl + (from ? "&from=" + from : "")
    );
  }

  const status = err.status || 500;

  if (config.environment === "development") {
    res.locals.error = {
      stack: err.stack
    };
  }

  res.locals.layout = "";
  res.status(status);
  res.render("error");
});

module.exports = dashboard;
