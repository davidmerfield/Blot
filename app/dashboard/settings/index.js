var express = require("express");
var settings = express.Router();
var load = require("./load");
var save = require("./save");
var trace = require("helper/trace");
var parse = require("dashboard/parse");
var config = require("config");

settings.use(function (req, res, next) {
  res.locals.selected = { settings: "selected", dashboard: "selected" };
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
    load.client,
    trace("client loaded"),
    function (req, res) {
      res.render("settings", { 
          title: req.blog.pretty.label, 
       })
      }
  );

settings.get(["/services", "/publishing",], load.plugins);

settings.use("/export", require('./export'));

settings.get("/date", load.timezones, load.dates);

settings.get("/link-format", load.permalinkFormats, function (req, res, next) {
  res.locals.edit = !!req.query.edit;
  next();
});

settings
  .route("/redirects/404s")
  .get(load.fourOhFour, function (req, res) {
    res.locals.breadcrumbs.add("Redirects", "redirects");
    res.locals.breadcrumbs.add("404 log", "404s");
    res.render("settings/redirects/404s", { title: "404s" });
  })
  .post(parse, require("./save/404"));

  settings.route("/redirects/bulk")
    .get(load.redirects, function (req, res) {
      res.locals.breadcrumbs.add("Redirects", "redirects");
      res.locals.breadcrumbs.add("Bulk editor", "bulk");
      res.render("settings/redirects/bulk", { title: "Bulk editor" });
    })


settings.get("/redirects", load.redirects);


settings.use("/client", require("./client"));

settings.use('/domain', require('./domain'));

settings.get("/:view", function (req, res) {
  var uppercaseName = req.params.view;

  uppercaseName = uppercaseName[0].toUpperCase() + uppercaseName.slice(1);

  if (uppercaseName === "Services") {
    uppercaseName = "External services";
  } else if (uppercaseName === "Publishing") {
    uppercaseName = "Publishing settings";
  } else if (uppercaseName === "Date") {
    uppercaseName = "Date and time";
  } else if (uppercaseName === "Link-format") {
    uppercaseName = "Link format";
  }

  res.locals.breadcrumbs.add(uppercaseName, req.params.view);
  res.locals.subpage = req.params.view;
  res.render("settings/" + req.params.view, { host: process.env.BLOT_HOST });
});

module.exports = settings;
