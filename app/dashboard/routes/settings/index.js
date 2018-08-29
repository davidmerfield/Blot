var errorHandler = require("./errorHandler");
var express = require("express");
var settings = express.Router();
var load = require("./load");
var save = require("./save");
var debug = require("../../debug");

var Template = require("template");
var Blog = require("blog");
var load = require("./load");

function Breadcrumbs() {
  var list = [];

  list.add = function(label, slug) {
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

settings.get("/settings", function(req, res, next) {
  res.redirect("/");
});

settings.use(function(req, res, next) {

  res.locals.settings_breadcrumbs = new Breadcrumbs();
  res.locals.settings_breadcrumbs.add("Settings", "/settings");

  next();
});

var index = settings.route("/");

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
    res.render("settings", { title: "Dashboard" });
  }
);

settings
  .route("/settings")
  .post(
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



settings.get("/settings/urls", function(req, res, next) {
  res.locals.edit = !!req.query.edit;
  next();
});

settings.get("/settings/menu", load.menu);
settings.get("/settings/date", load.timezones, load.dates);
settings.get("/settings/services", load.plugins);
settings.get("/settings/urls", load.permalinkFormats);

settings.use('/settings/urls/*', function(req, res, next){
  res.locals.settings_breadcrumbs.add('URLs', 'urls');
  next();
});

settings
  .route("/settings/urls/404s")
  .get(load.fourOhFour, function(req, res) {
    res.locals.settings_breadcrumbs.add("404 log", "404s");
    res.render("settings/404s", { title: "404s" });
  })
  .post(
    require("body-parser").urlencoded({ extended: false }),
    require("./save/404")
  );


settings.get('/settings/urls/redirects',load.redirects, function(req, res){
  res.locals.settings_breadcrumbs.add('Redirects', 'redirects');
  res.locals.partials.subpage = "settings/redirects";  
  res.render("settings/subpage", { title: 'Redirects' });
});

// Load the list of templates for this user

settings.use("/settings/theme", load.theme, function(req, res, next) {
  res.locals.settings_breadcrumbs.add("Theme", "theme");
  next();
});

settings
  .route("/settings/theme")
  .get(function(req, res) {
    res.render("theme", {title: "Theme"});
  })
  .post(require('./save/theme'));

settings
  .route("/settings/theme/new")
  .get(function(req, res) {
    res.locals.settings_breadcrumbs.add("Create new theme", "new");
    res.render("theme/new", {title: 'Create new theme'});
  })
  .post(require('./save/newTheme'));

settings.get("/settings/:view", function(req, res) {
  var uppercaseName = req.params.view;

  uppercaseName = uppercaseName[0].toUpperCase() + uppercaseName.slice(1);

  if (uppercaseName === "Urls") uppercaseName = "URLs";

  res.locals.settings_breadcrumbs.add(uppercaseName, req.params.view);
  res.locals.partials.subpage = "settings/" + req.params.view;
  res.render("settings/subpage", { host: process.env.BLOT_HOST });
});

module.exports = settings;
