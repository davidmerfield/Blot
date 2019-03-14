var Express = require("express");
var brochure = new Express.Router();
var finder = require("finder");
var tex = require("./tools/tex");
var config = require("config");

// Renders the folders and text editors
brochure.use(finder.middleware);

// Renders TeX
brochure.use(tex);

// Renders dates dynamically
brochure.use(require("./tools/dates"));

// Fixes basic typographic errors
// See typeset.js for more information
brochure.use(require("./tools/typeset"));

// CSS required to render the windows
brochure.get("/css/finder.css", function(req, res) {
  res.setHeader("Content-Type", "text/css");
  res.send(finder.css());
});

brochure.get("/about", function(req, res) {
  res.locals.title = "Blot – About";
  res.render("about");
});

brochure.get("/support", function(req, res) {
  res.locals.title = "Blot – Support";
  res.render("support");
});

brochure.get("/contact", function(req, res) {
  res.locals.title = "Contact";
  res.render("contact");
});

brochure.get("/terms", function(req, res) {
  res.locals.title = "Terms of use";
  res.locals.layout = "/partials/layout-focussed.html";
  res.render("terms");
});

brochure.get("/privacy", function(req, res) {
  res.locals.title = "Privacy policy";
  res.locals.layout = "/partials/layout-focussed.html";
  res.render("privacy");
});

brochure.get("/sitemap.xml", require("./sitemap"));

brochure.use("/developers", require("./developers"));

// brochure.use("/templates", require("./templates"));

brochure.use("/news", require("./news"));

brochure.use("/sign-up", require("./sign-up"));

brochure.use("/log-in", require("./log-in"));

brochure.use(function(req, res, next) {
  res.locals.base = "";
  res.locals.selected = {};
  next();
});

brochure.param("section", function(req, res, next) {
  res.locals.selected[req.params.section] = "selected";
  next();
});

brochure.param("subsection", function(req, res, next) {
  res.locals.selected[req.params.subsection] = "selected";
  next();
});

brochure.get("/", function(req, res) {
  res.locals.title = "Blot – A blogging platform with no interface";
  res.locals.selected.index = "selected";
  res.locals.featured = require("./featured");
  res.locals.featured = res.locals.featured.map(function(site) {
    if (site.template) site.templateLower = site.template.toLowerCase();
    return site;
  });

  res.render("index");
});

var tex = require('./tools/tex');

brochure.use('/publishing/formatting', tex);

brochure.get("/:section", function(req, res, next) {
  // This check is designed to prevent an error polluting
  // the logs which happens for requests like /images/foo.png
  // Express doesn't have a renderer for '.png' so there is an error
  if (req.params.section.indexOf(".") > -1) {
    return next();
  }

  res.locals.title = "Blot – " + req.params.section;
  res.render(req.params.section);
});

brochure.get("/:section/:subsection", function(req, res, next) {
  // This check is designed to prevent an error polluting
  // the logs which happens for requests like /images/foo.png
  // Express doesn't have a renderer for '.png' so there is an error
  if (
    req.params.section.indexOf(".") > -1 ||
    req.params.subsection.indexOf(".") > -1
  ) {
    return next();
  }

  res.locals.title =
    "Blot – " + req.params.section + " – " + req.params.subsection;
  res.render(req.params.section + "/" + req.params.subsection);
});

brochure.get("/:section/:subsection/:subsubsection", function(req, res, next) {
  // This check is designed to prevent an error polluting
  // the logs which happens for requests like /images/foo.png
  // Express doesn't have a renderer for '.png' so there is an error
  if (
    req.params.section.indexOf(".") > -1 ||
    req.params.subsection.indexOf(".") > -1
  ) {
    return next();
  }

  res.locals.title =
    "Blot – " + req.params.subsubsection + " – " + req.params.section;
  res.render(req.params.section + "/" + req.params.subsection + '/' + req.params.subsubsection);
});

brochure.use(function(err, req, res, next) {
  if (config.environment === "development") console.log(err);
  next();
});

module.exports = brochure;
