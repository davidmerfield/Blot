var express = require("express");
var settings = express.Router();
var load = require("./load");
var save = require("./save");
var trace = require("helper/trace");
const parse = require("dashboard/util/parse");

settings
  .post("/",
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


settings.get("/", load.client, (req, res) => {
  res.render("dashboard/settings", { 
      title: req.blog.pretty.label, 
    })
});

  
settings.get("/services", load.plugins, (req, res)=>{
  res.locals.breadcrumbs.add("Services", "services");
  res.render("dashboard/settings/services");
});

settings.get("/publishing", load.plugins, (req, res)=>{
  res.locals.breadcrumbs.add("Publishing", "publishing");
  res.render("dashboard/settings/publishing");
});

settings.get("/date", load.timezones, load.dates, (req, res)=>{
  res.locals.breadcrumbs.add("Date and time", "date");
  res.render("dashboard/settings/date");
});

settings.get("/link-format", load.permalinkFormats,  (req, res, next) => {
  res.locals.edit = !!req.query.edit;
  res.locals.breadcrumbs.add("Link format", "link-format");
  res.render("dashboard/settings/link-format");
});

settings.get("/redirects", load.redirects, (req, res) => {
  res.locals.breadcrumbs.add("Redirects", "redirects");
  res.render("dashboard/settings/redirects");
});

settings
  .route("/redirects/404s")
  .get(load.fourOhFour, function (req, res) {
    res.locals.breadcrumbs.add("Redirects", "redirects");
    res.locals.breadcrumbs.add("404 log", "404s");
    res.render("dashboard/settings/redirects/404s");
  })
  .post(parse, require("./save/404"));

settings.route("/redirects/bulk")
  .get(load.redirects, function (req, res) {
    res.locals.breadcrumbs.add("Redirects", "redirects");
    res.locals.breadcrumbs.add("Bulk editor", "bulk");
    res.render("dashboard/settings/redirects/bulk");
  })

module.exports = settings;