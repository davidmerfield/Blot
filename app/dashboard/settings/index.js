var express = require("express");
var settings = express.Router();
var load = require("./load");
var save = require("./save");
var trace = require("helper/trace");
var parse = require("dashboard/parse");
var Template = require("models/template");

settings.use(function (req, res, next) {
  res.locals.selected = { settings: "selected", dashboard: "selected" };
  next();
});

settings.use(function (req, res, next) {
  res.locals.setup = !!req.query.setup;
  next();
});

settings.use("/delete", require("./delete"));

settings
  .route("/")
  .post(
    trace("parsing form"),
    save.parse,
    trace("parsed form"),
    save.redirects,
    trace("saved redirects"),
    save.format,
    trace("formated form"),
    save.analytics,
    trace("saved analytics"),
    save.avatar,
    trace("saved avatar"),
    save.removeTmpFiles,
    trace("removed any tmp files"),
    save.finish
  )
  .get(
    trace("loading folder"),
    require("../folder"),
    load.template,
    trace("template loaded"),
    load.menu,
    trace("menu loaded"),
    load.client,

    trace("client loaded"),
    load.plugins,
    load.permalinkFormats,
    load.dates,
    function (req, res) {
      res.render("settings", { title: req.blog.pretty.label });
    }
  );

settings.get(["/services", "/images", "/typography"], load.plugins);

settings.get("/links", load.menu);

settings.get("/date", load.timezones, load.dates);

settings.get("/link-format", load.permalinkFormats, function (req, res, next) {
  res.locals.edit = !!req.query.edit;
  next();
});

settings
  .route("/404s")
  .get(load.fourOhFour, function (req, res) {
    res.locals.breadcrumbs.add("404 log", "404s");
    res.render("settings/404s", { title: "404s" });
  })
  .post(parse, require("./save/404"));

settings.get("/redirects", load.redirects);

// Load the list of templates for this user

settings.use("/template", load.templates, function (req, res, next) {
  res.locals.breadcrumbs.add("Template", "template");
  next();
});

settings.get("/verify-domain/:domain", require("./verify-domain"));

settings.use("/client", require("./client"));

settings
  .route("/template")
  .get(function (req, res) {
    res.render("template", { title: "Template" });
  })
  .post(parse, require("./save/template"));

settings
  .route("/template/new")
  .get(function (req, res) {
    res.locals.breadcrumbs.add("New", "new");
    res.render("template/new", { title: "New template" });
  })
  .post(parse, require("./save/newTemplate"));

settings
  .route("/template/install")
  .post(parse, require("./load/templates"), require("./save/installTemplate"));

settings
  .route("/template/archive")
  .all(load.pastTemplates)
  .get(function (req, res) {
    res.locals.breadcrumbs.add("Archive", "archive");
    res.render("template/archive", { title: "Archive" });
  });

settings.get("/:view", function (req, res) {
  var uppercaseName = req.params.view;

  uppercaseName = uppercaseName[0].toUpperCase() + uppercaseName.slice(1);

  if (uppercaseName !== "Profile") {
    res.locals.breadcrumbs.add(uppercaseName, req.params.view);
  }

  res.locals.subpage = req.params.view;
  res.render("settings/" + req.params.view, { host: process.env.BLOT_HOST });
});

module.exports = settings;
