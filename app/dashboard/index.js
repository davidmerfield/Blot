const trace = require("helper/trace");
const config = require("config");
const express = require("express");
const message = require("./util/message");

const dashboard = express.Router();
const logout = require("dashboard/account/util/logout");


dashboard.use(trace("loading session information"));
dashboard.use(require("./session"));
dashboard.use(trace("loaded session information"));

// For each GET request -> Appends a one-time CSRF-checking token
// for each POST request -> validates this token using csurf
dashboard.use(require("./util/csrf"));

// These need to be accessible to unauthenticated users
dashboard.use("/sign-up", require("./sign-up"));
dashboard.use("/log-in", require("./log-in"));

dashboard.get("/disabled", logout, (req, res) => {
  res.render("dashboard/disabled");
});

dashboard.get("/deleted", logout, (req, res) => {
  res.render("dashboard/deleted");
});

// Everything afterwards should be authenticated
dashboard.use(function (req, res, next) {

  res.locals.selected = { dashboard: "selected" };

  if (req.session && req.session.uid) {
    return next();
  }
  

  next(new Error("NOUSER"));
});

dashboard.use(message.middleware);

dashboard.use(trace("loading user"));
dashboard.use(require("./util/load-user"));
dashboard.use(trace("loaded user"));

dashboard.use(trace("loading blog"));
dashboard.param("handle", require("./util/load-blog"));
dashboard.use(trace("loaded blog"));

// Performs some basic checks about the
// state of the user's blog, user's subscription
// and shuttles the user around as needed
dashboard.use(trace("checking redirects"));
dashboard.use(require("./redirector"));
dashboard.use(trace("checked redirects"));

dashboard.use(require("./util/breadcrumbs"));

dashboard.use("/stats", require("./stats"));

// These need to be before ':handle'
dashboard.use("/account", require("./account"));

dashboard.use(
  "/share-template",
  require("./util/load-blogs"),
  require("./template/share-template")
);


const sse = require("helper/sse")({ channel: (req) => `sync:status:${req.blog.id}` });

dashboard.get("/", require("./util/load-blogs"), async (req, res) => {
  res.locals.title = "Sites";
  res.locals.breadcrumbs.add("Sites", "/sites");
  res.render("dashboard");
});

dashboard.use("/:handle", function (req, res, next) {
  // we use pretty.label instead of title for title-less blogs
  // this falls back to the domain of the blog if no title exists
  res.locals.base = `/sites/${req.params.handle}`;
  res.locals.breadcrumbs.add("Sites", "/sites");
  res.locals.breadcrumbs.add(req.blog.pretty.label, `${req.params.handle}`);
  res.locals.title = req.blog.pretty.label;
  next();
});

// Load the files and folders inside a blog's folder
dashboard.get(["/:handle", "/:handle/folder/:path(*)"], require("./folder"));

dashboard.get("/:handle/folder", (req, res) => {
  // redirect to client settings page
  res.redirect(`/sites/${req.params.handle}/client`);
});

dashboard.use("/:handle/template", require("./template"));
dashboard.use("/:handle/delete", require("./delete"));
dashboard.use("/:handle/import", require("./import"));
dashboard.use("/:handle/export", require("./export"));
dashboard.use("/:handle/domain", require("./domain"));
dashboard.use("/:handle/client", require("./client"));
dashboard.use("/:handle/title", require("./title"));
dashboard.get("/:handle/status", sse);
// allow the download of files directly
dashboard.use("/:handle/folder-download/:path(*)", require('./folder/download'));
dashboard.use("/:handle", require("./settings"));



// This will catch old links to the dashboard before
// we encoded the blog's username in the URLs
dashboard.use(require("./util/redirect-to-other-blog"));

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
