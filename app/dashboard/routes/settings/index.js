var errorHandler = require("./errorHandler");
var express = require("express");
var settings = express.Router();
var load = require("./load");
var save = require("./save");
var index = settings.route("/");
var debug = require("../../debug");

index.get(
  load.template,
  debug("template loaded"),
  load.menu,
  debug("menu loaded"),
  load.client,
  debug("client loaded"),
  load.dates,
  debug("dates loaded"),
  load.permalinkFormats,
  debug("permalinks loaded"),
  function(req, res) {
    res.render("settings", {title: 'Dashboard'});
  }
);


settings.route("/settings").post(
  save.parse,
  debug("parsed form"),
  save.redirects,
  debug("saved redirects"),
  save.format,
  debug("formated form"),
  save.avatar,
  debug("saved avatar"),
  save.finish
);

index.all(errorHandler);

// require("./404s")(server);

settings.get("/settings/links", load.menu);
settings.get("/settings/date", load.timezones, load.dates);
settings.get("/settings/services", load.plugins, load.permalinkFormats, load.redirects);

settings.get("/settings/:view", function(req, res) {
  var uppercaseName = req.params.view;

  uppercaseName = uppercaseName[0].toUpperCase() + uppercaseName.slice(1);

  res.locals.partials.subpage = "settings/" + req.params.view;
  res.locals.subpage_title = uppercaseName;
  res.locals.subpage_slug = req.params.view;
  res.render("settings/subpage", { host: process.env.BLOT_HOST });
});

module.exports = settings;
